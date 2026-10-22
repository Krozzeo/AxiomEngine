import {listenLoopback} from 'axiom-platform/loopback';
import {pickFolder} from './folder-picker.mjs';
import {createAuthoringPort} from '../../platform/authoring.mjs';
import {addLocalProject,githubProjects,importGitHubProject} from './github/import-project.mjs';
import {GitHubPublication} from './github/publication.mjs';
import {spawn} from 'node:child_process';
import packageData from '../../package.json' with {type:'json'};
import {HubSettings,axiomApplications} from './hub-settings.mjs';
import {extractPmdImport,exportPmd} from './pmd-import.mjs';
import {OpenAiAssistant} from './agent/openai-assistant.mjs';
import {openEditor} from './open-editor.mjs';
import {ProposalManager} from './workspaces/manager.mjs';
import {tools,toolMap,validate,bounded} from './agent/contracts.mjs';
import {AgentService,compactResult} from './agent/service.mjs';
import {EditorBridge} from './agent/editor-bridge.mjs';
import { createHash, randomBytes } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { extname, join, resolve, relative, isAbsolute, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CommandBus } from "./command-bus.mjs";
import { SceneWorkspace } from "./scene-workspace.mjs";
import { ProjectStore } from "./project-store.mjs";
import { buildEditor } from "../../scripts/build-editor.mjs";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const DIST = join(ROOT, "dist/editor");
const BODY_LIMIT = 256 * 1024;
const IMPORT_LIMIT = 12 * 1024 * 1024;
const SECURITY_HEADERS = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; connect-src 'self' https: http:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
};

async function ensureEditorBuild() {
  try {
    await Promise.all([
      access(join(DIST, "index.html")),
      access(join(DIST, "styles.css")),
      access(join(DIST, "main.js"))
    ]);
  } catch {
    await buildEditor();
  }
}

function json(response, status, value) {
  response.writeHead(status, { ...SECURITY_HEADERS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
}

async function readJson(request) {
  let total = 0;
  const chunks = [];
  for await (const chunk of request) {
    total += chunk.length;
    if (total > IMPORT_LIMIT) throw Object.assign(new Error("Request body too large"), { status: 413 });
    chunks.push(chunk);
  }
  try {
    const value=JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if(total>BODY_LIMIT && !["asset.import","asset.job.start"].includes(value?.payload?.type) && !["asset.import","asset.job.start"].includes(value?.name) && !value?.clientId) throw Object.assign(new Error("Request body too large"), {status:413});
    return value;
  } catch (error) {
    if(error.status===413) throw error;
    throw Object.assign(new Error("Malformed JSON"), { status: 400 });
  }
}

async function schemaHash() {
  const files = ["command.schema.json", "event.schema.json", "protocol-envelope.schema.json", "project-document.schema.json"];
  const hash = createHash("sha256");
  for (const file of files) hash.update(await readFile(join(ROOT, "protocol/schema", file)));
  return `sha256:${hash.digest("hex")}`;
}

function mime(path) {
  return ({ ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".wasm": "application/wasm", ".svg":"image/svg+xml", ".png":"image/png" })[extname(path)] ?? "application/octet-stream";
}

export async function startServer(options = {}) {
  await ensureEditorBuild();
  const token = options.token ?? randomBytes(32).toString("base64url");
  const hubSettings=new HubSettings(options.hubSettings);const configured=options.projectRoot?{projectRoot:options.projectRoot}:await hubSettings.load();
  const workspace = new SceneWorkspace(new ProjectStore(configured.projectRoot,{folders:!options.projectRoot||options.projectFolders===true}));
  const bus = new CommandBus({ projects: workspace });
  const proposals=new ProposalManager(workspace);await proposals.initialize();
  const github=new GitHubPublication({workspace,proposals,...(!options.projectRoot?{statePath:join(hubSettings.settingsRoot,'github-session.json')}:{}) ,...(options.githubOptions??{})});await github.ready;
  bus.onCommitted=()=>void bus.transaction(()=>github.observeSaved()).catch(error=>bus.recordError(error));
  const view={get project(){return proposals.active.project;},get revision(){return proposals.active.revision;},get workspaceId(){return proposals.previewId;},snapshot:()=>proposals.view()};
  const bridge=new EditorBridge(view,error=>bus.recordError(error));
  bus.agentService=new AgentService({workspace,bus,bridge});bus.agentService.proposals=proposals;bus.agentService.github=github;
  const assistant=new OpenAiAssistant({bus,workspace,proposals,bridge,apiKey:'',...(!options.projectRoot?{sessionPath:join(hubSettings.settingsRoot,'assistant-session.json')}:{}) ,...(options.assistantOptions??{})});await assistant.ready;bus.agentService.assistant=assistant;
  const platform=options.platformSession?createAuthoringPort({workspace,bus,proposals,integrationStatus:()=>{const s=github.status();return {connected:s.connected,repository:s.repository,branch:s.branch,accountMatches:s.accountMatches};}}):null;
  const runtimeCookie = randomBytes(32).toString("base64url");
  const hash = await schemaHash();
  const startedAt = performance.now();
  let requestCount = 0;
  let rejectedCount = 0;
  let allowedOrigins = new Set();

  let closing;
  let embeddingOrigin;
  if(options.embeddingOrigin){const u=new URL(options.embeddingOrigin);if(u.protocol!=='http:'||u.hostname!=='127.0.0.1'||u.origin!==options.embeddingOrigin)throw Error('Invalid Platform embedding origin');embeddingOrigin=u.origin;}
  const server = createHttpServer(async (request, response) => {
    if(embeddingOrigin){const write=response.writeHead;response.writeHead=function(status,headers){return write.call(this,status,{...headers,'Cross-Origin-Resource-Policy':'cross-origin','Content-Security-Policy':SECURITY_HEADERS['Content-Security-Policy'].replace("frame-ancestors 'none'",'frame-ancestors '+embeddingOrigin)});};}
    requestCount += 1;
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    try {
      if (url.pathname.startsWith("/v1/")) {
        const origin = request.headers.origin;
        const authorization = request.headers.authorization;
        const fetchSite = request.headers["sec-fetch-site"];
        // Browsers commonly omit Origin on same-origin GET requests. Sec-Fetch-Site
        // is a forbidden request header controlled by the browser, so it safely
        // distinguishes that case. Requests carrying Origin must always match it.
        const authorizedBrowserContext = origin
          ? allowedOrigins.has(origin)
          : fetchSite === "same-origin";
        if (!authorizedBrowserContext) {
          rejectedCount += 1;
          return json(response, 403, { code: "AX_SECURITY_0001", cause: "Origin is not authorized" });
        }
        if (authorization !== `Bearer ${token}`) {
          rejectedCount += 1;
          return json(response, 401, { code: "AX_SECURITY_0002", cause: "Session token is invalid" });
        }
      }

      if(platform&&request.method!=='GET'&&url.pathname==='/v1/hub')return json(response,409,{code:'AX_SCENE_0003',cause:'Manage hosted projects from Axiom Platform.'});

      if(url.pathname.startsWith("/script-runtime/")) {
        const origin=request.headers.origin;
        if(request.method!=="GET"||(origin?!allowedOrigins.has(origin):request.headers["sec-fetch-site"]!=="same-origin")||!request.headers.cookie?.split("; ").includes("axiom-runtime="+runtimeCookie))return json(response,403,{code:"AX_SECURITY_0001"});
        const match=url.pathname.match(/^\/script-runtime\/([0-9a-f-]{36})\/([0-9a-f-]{36})\/([a-zA-Z0-9_.-]+)$/);
        const serving=proposals.active;const project=serving.project,build=project?.scene.script?.build;
        if(!match||project?.id!=="project://"+match[1]||build?.id!==match[2])return json(response,404,{code:"AX_SCRIPT_0001"});
        try {
          const content=await serving.compiler.read(project.id,build,match[3]);
          const type=({".js":"text/javascript",".json":"application/json",".wasm":"application/wasm"})[extname(match[3])]??"application/octet-stream";
          response.writeHead(200,{...SECURITY_HEADERS,"Content-Type":type,"Cache-Control":"private, no-store"});return response.end(content);
        }catch{return json(response,404,{code:"AX_SCRIPT_0001"});}
      }
      if (request.method === "GET" && url.pathname === "/health") {
        return json(response, 200, { status: "ok", service: "axiom-daemon-bootstrap", version: packageData.version });
      }

      if (request.method === "GET" && url.pathname === "/v1/handshake") {
        const requested = Number(request.headers["axiom-protocol-version"] ?? 1);
        if (requested !== 1) return json(response, 409, { code: "AX_PROTOCOL_0003", supported: { min: 1, max: 1 } });
        response.setHeader("Set-Cookie",`axiom-runtime=${runtimeCookie}; HttpOnly; SameSite=Strict; Path=/script-runtime/`);
        return json(response, 200, {
          platformSession:!!platform,
          protocol: { min: 1, max: 1, selected: 1 },
          schemaHash: hash,
          server: { name: "axiom-daemon-bootstrap", version: packageData.version },
          capabilities: [...tools.map(t=>"command."+t.name),"events.delta","diagnostics.trace","agent.tools","editor.bridge","ai.assistant"],
          limits: { requestBytes: BODY_LIMIT, importBytes: IMPORT_LIMIT, retainedEvents: 512, retainedTraces: 128 }
        });
      }

      if(url.pathname.startsWith('/v1/github/')){
        const action=url.pathname.slice('/v1/github/'.length);
        if(request.method==='GET'&&action==='status')return json(response,200,github.status());
        if(request.method==='GET'&&action==='history'){const id=url.searchParams.get('id');if(!workspace.project||id!==workspace.project.id)throw Error('Open this project before inspecting its history');const raw=url.searchParams.get('before'),before=raw===null?undefined:Number(raw);if(before!==undefined&&(!Number.isSafeInteger(before)||before<1))throw Error('Invalid history cursor');return json(response,200,await github.history.list(id,before));}
        if(request.method==='GET'&&action==='repositories')return json(response,200,{items:await github.client.repositories()});
        if(request.method==='POST'){
          const data=await readJson(request);
          if(['connect','disconnect'].includes(action))throw Object.assign(Error('Manage GitHub accounts in Axiom Platform Settings.'),{code:'AX_GITHUB_0002'});
          const operations={connect:()=>github.connect(data.token),disconnect:()=>github.disconnect(),create:async()=>{if(!workspace.project||workspace.project.id!==data.id)throw Error('Open this project before creating its repository');const repo=await github.client.create(data.name,data.private);await github.record('repository.created',{repository:repo.name});return repo;},draft:()=>github.draft(data),configure:()=>github.configure(data),preferences:()=>github.preferences(data),preview:()=>github.prepare(data),publish:()=>github.publish(data),reconcile:()=>github.reconcile(data),retry:()=>github.retry(data)};
          if(Object.hasOwn(operations,action))return json(response,200,await bus.transaction(async()=>{try{const value=await operations[action]();if(['connect','disconnect'].includes(action))await github.record('account.'+action);return value;}catch(error){await github.record(action+'.failed',{code:error.code??'AX_GITHUB_0001',reason:error.code?String(error.message).slice(0,300):'Operation failed; see the panel error'});throw error;}}));
        }
        return json(response,404,{code:'AX_HTTP_0002',cause:'Unknown GitHub operation'});
      }
      if(request.method==='POST'&&url.pathname==='/v1/pmd/import')return json(response,200,await extractPmdImport(await readJson(request)));
      if(request.method==='POST'&&url.pathname==='/v1/pmd/export'){const data=await readJson(request);return json(response,200,{base64:Buffer.from(exportPmd(data.pmd)).toString('base64')});}
      if(request.method==='POST'&&url.pathname==='/v1/ai/attachments')return json(response,200,await assistant.attach(await readJson(request)));
      if(request.method==='GET'&&url.pathname==='/v1/ai/history')return json(response,200,{text:assistant.exportHistory(),filename:'Axiom-AI-history.txt'});
      if(url.pathname==='/v1/hub'){
        if(request.method==='GET')return json(response,200,{version:packageData.version,applications:axiomApplications,projectRoot:workspace.store.root,projects:(await workspace.store.run('project.list',{})).projects,legacyRoot:join(ROOT,'.axiom/projects')});
        if(request.method==='POST'){const data=await readJson(request);if(assistant.active)throw Error('Finish or cancel the AI task before managing projects');if(['configure','import-legacy'].includes(data.action)&&workspace.project)throw Error('Close the project before changing Hub storage');
          if(data.action==='pick-folder')return json(response,200,await (options.pickFolder??pickFolder)({initial:data.initial??''}));
          if(data.action==='add-project')return json(response,200,await bus.transaction(()=>addLocalProject(workspace.store,data.path)));
          if(data.action==='github-projects'){const source=await githubProjects(github.client,data);return json(response,200,{repository:source.repository,branch:source.branch,items:source.items});}
          if(data.action==='github-import')return json(response,200,await bus.transaction(async()=>{const result=await importGitHubProject(workspace.store,github.client,data);await github.record('project.imported',{repository:result.repository,branch:result.branch},result.id);return result;}));
          if(data.action==='open-folder'){await workspace.store.directory();const entry=(await workspace.store.run('project.list',{})).projects.find(p=>p.id===data.id);if(!entry)throw Error('Unknown project');const folder=dirname(entry.path),command=process.platform==='win32'?'explorer.exe':process.platform==='darwin'?'open':'xdg-open';await new Promise((yes,no)=>{const child=spawn(command,[folder],{shell:false,stdio:'ignore'});child.once('error',no);child.once('spawn',()=>{child.unref();yes();});});return json(response,200,{opened:true});}
          if(data.action==='delete'){if(workspace.project?.id===data.id)throw Error('Close this project before deleting it');if(data.confirm!==true)throw Error('Project deletion requires confirmation');for(const item of [...proposals.items.values()].filter(v=>v.base.id===data.id)){if(proposals.busy(item)||item.child.playing)throw Error('Stop the project proposal and finish its jobs before deletion');await proposals.run('workspace.reject',{workspaceId:item.id,expectedWorkspaceRevision:item.child.revision},{actor:{kind:'human',id:'hub'}});}const result=await workspace.store.run('project.delete',{id:data.id,confirm:data.confirm});return json(response,200,result);}
          if(data.action==='import-legacy'){if(!workspace.store.folders)throw Error('Select persistent folder storage first');return json(response,200,await workspace.store.importLegacy(data.sourceRoot?resolve(data.sourceRoot):join(ROOT,'.axiom/projects')));}
          if(data.action==='configure'){if(proposals.items.size)throw Error('Resolve retained proposals before switching project storage');if(typeof data.projectRoot!=='string'||!data.projectRoot.trim())throw Error('Enter a valid project storage path');const previous=workspace.store.root,previousFolders=workspace.store.folders,next=resolve(data.projectRoot);if(next===ROOT||(!relative(ROOT,next).startsWith('..')&&!isAbsolute(relative(ROOT,next))))throw Error('Choose a project directory outside the application files');workspace.store.root=next;workspace.store.folders=true;try{await workspace.store.directory();await proposals.initialize();await assistant.rebindProjectStorage();await hubSettings.save(next);}catch(error){workspace.store.root=previous;workspace.store.folders=previousFolders;workspace.store.locations=new Map();proposals.items.clear();proposals.previewId=null;workspace.project=null;await proposals.initialize();await assistant.rebindProjectStorage();throw error;}return json(response,200,{projectRoot:next});}
          throw Error('Unknown Hub action');
        }
      }
      if(request.method==='GET'&&url.pathname==='/v1/ai/status')return json(response,200,assistant.status());
      if(request.method==='POST'&&url.pathname==='/v1/ai/configure'){const data=await readJson(request);if(['connect','disconnect'].includes(data.action)||data.apiKey)throw Object.assign(Error('Manage OpenAI accounts in Axiom Platform Settings.'),{code:'AX_AI_0001'});return json(response,200,await assistant.configure(data));}
      if(request.method==='POST'&&url.pathname==='/v1/ai/tasks')return json(response,200,assistant.start(await readJson(request)));
      if(request.method==='GET'&&url.pathname==='/v1/ai/tasks')return json(response,200,url.searchParams.has('id')?assistant.task(url.searchParams.get('id')):{items:assistant.tasks()});
      if(request.method==='GET'&&url.pathname==='/v1/ai/proposals')return json(response,200,url.searchParams.has('id')?proposals.review(url.searchParams.get('id')):{items:proposals.list()});
      if(request.method==='POST'&&url.pathname==='/v1/ai/preview'){const data=await readJson(request);if(!['preview','continue','reject'].includes(data.action))throw Error('Invalid preview action');return json(response,200,await bus.transaction(async()=>{await proposals.run('workspace.'+data.action,data,{actor:{kind:'human',id:'editor'}});return {snapshot:proposals.view()};}));}
      if(request.method==='GET'&&url.pathname==='/v1/ai/recoveries')return json(response,200,{items:await proposals.recoveries()});
      if(request.method==='POST'&&url.pathname==='/v1/ai/apply'){const data=await readJson(request);return json(response,200,await bus.transaction(async()=>{const result=await proposals.apply(data,{actor:{kind:'human',id:'editor'}});await github.observeSaved();return result;}));}
      if(request.method==='POST'&&url.pathname==='/v1/ai/recover'){const data=await readJson(request);return json(response,200,await bus.transaction(()=>proposals.recover(data,{actor:{kind:'human',id:'editor'}})));}
      if(request.method==='POST'&&url.pathname==='/v1/ai/cancel'){const data=await readJson(request);return json(response,200,assistant.cancel(data.id));}
      if(request.method==='GET'&&url.pathname==='/v1/tools')return json(response,200,{tools:tools.filter(t=>t.mcp)});
      if(platform&&request.method==='POST'&&url.pathname==='/v1/platform/editor-state')return json(response,200,platform.reportEditor(await readJson(request)));
      if(request.method==='POST'&&url.pathname==='/v1/editor/sync')return json(response,200,{...bridge.sync(await readJson(request)),proposals:proposals.list()});
      if(request.method==='POST'&&url.pathname==='/v1/editor/disconnect')return json(response,200,{released:bridge.release((await readJson(request)).clientId)});
      if(request.method==='POST'&&url.pathname==='/v1/tools/call'){
        const call=await readJson(request),tool=toolMap.get(call.name);
        if(!tool?.mcp)return json(response,404,{code:'AX_AGENT_0004',cause:'Tool is unavailable'});
        validate(tool.inputSchema,call.arguments??{});
        const {envelope}=await import('../../protocol/src/protocol.ts');
        const result=await bus.dispatch(envelope('command',{type:call.name,data:call.arguments??{}},{actor:{kind:'agent',id:'mcp-client'}}));
        return json(response,200,tool.route==='workspace'?bounded(compactResult(result),65536):result);
      }
      if (request.method === "POST" && url.pathname === "/v1/commands") {
        const command = await readJson(request);
        const tool=toolMap.get(command?.payload?.type);
        if(tool?.mcp)validate(tool.inputSchema,command.payload.data??{});
        const result = await bus.dispatch(command);
        return json(response, result.kind === "error" ? 422 : 200, result);
      }

      if (request.method === "GET" && url.pathname === "/v1/events") {
        return json(response, 200, { events: bus.eventsSince(Number(url.searchParams.get("since") ?? 0)), state: bus.state });
      }

      if (request.method === "GET" && url.pathname.startsWith("/v1/traces/")) {
        const trace = bus.trace(decodeURIComponent(url.pathname.slice("/v1/traces/".length)));
        return trace ? json(response, 200, trace) : json(response, 404, { code: "AX_DIAGNOSTICS_0001", cause: "Trace was not retained" });
      }

      if (request.method === "GET" && url.pathname === "/v1/metrics") {
        return json(response, 200, {
          uptimeMs: performance.now() - startedAt,
          requests: requestCount,
          securityRejections: rejectedCount,
          commandState: bus.state
        });
      }

      // Browsers request this optional resource automatically. No icon is shipped.
      if (request.method === "GET" && url.pathname === "/favicon.ico") {
        response.writeHead(204, SECURITY_HEADERS);
        return response.end();
      }

      if (request.method === "GET") {
        const relative = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
        if (relative.includes("..") || relative.includes("\\")) return json(response, 400, { code: "AX_HTTP_0001" });
        const path = join(DIST, relative);
        let content;
        try { content = await readFile(path); }
        catch (error) {
          if (error.code === "ENOENT") return json(response, 404, { code: "AX_HTTP_0002", cause: "Asset not found" });
          throw error;
        }
        response.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": mime(path), "Cache-Control": "no-store" });
        return response.end(content);
      }

      return json(response, 404, { code: "AX_HTTP_0002", cause: "Route not found" });
    } catch (error) {
      const known=typeof error.code==='string'&&/^(AX_AI_|AX_AGENT_|AX_SCENE_|AX_WORKSPACE_|AX_GITHUB_)/.test(error.code);
      if(known)bus.recordError({code:error.code,cause:error.message});
      return json(response, error.status ?? (known?422:500), { code: known?error.code:error.status === 413 ? "AX_HTTP_0003" : "AX_SYSTEM_0002", cause: error.message });
    }
  });

  await listenLoopback(server,options.port??0);
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  allowedOrigins = new Set([origin, `http://localhost:${address.port}`]);
  return {
    server,
    ...(platform?{platform}:{}),
    token,
    origin,
    editorUrl: `${origin}/#token=${encodeURIComponent(token)}`,
    close: () => closing??=(async()=>{
      const httpClosed=new Promise((resolveClose,reject)=>{server.close(error=>error&&error.code!=='ERR_SERVER_NOT_RUNNING'?reject(error):resolveClose());server.closeAllConnections();});
      if(!github.client.sharedAccount)github.disconnect();else github.client.close();await assistant.close();await bus.agentService.autonomy?.close();bridge.close();await bus.transaction(async()=>{});
      workspace.activeJob?.controller.abort();workspace.activeScriptJob?.controller.abort();
      const deadline=Date.now()+10000;while((workspace.activeJob||workspace.activeScriptJob)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));
      if(workspace.activeJob||workspace.activeScriptJob)throw Error('Owned compiler/import job did not stop during shutdown');
      await proposals.close();await httpClosed;
    })()
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.AXIOM_PORT ? Number(process.env.AXIOM_PORT) : 4317;
  const instance = await startServer({ port });
  console.log(`Axiom daemon bootstrap listening at ${instance.origin}`);
  console.log(`Open editor: ${instance.editorUrl}`);
  if(process.env.AXIOM_OPEN_BROWSER!=='0'&&!process.env.CI&&!process.argv.includes('--no-open')) {
    void openEditor(instance.editorUrl).then(opened=>{if(!opened)console.log('Automatic browser opening unavailable; use the editor URL above.');});
  }
}
