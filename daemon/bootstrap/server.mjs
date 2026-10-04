import {ProposalManager} from './workspaces/manager.mjs';
import {tools,toolMap,validate,bounded} from './agent/contracts.mjs';
import {AgentService,compactResult} from './agent/service.mjs';
import {EditorBridge} from './agent/editor-bridge.mjs';
import { createHash, randomBytes } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { extname, join, resolve } from "node:path";
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
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
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
  return ({ ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" })[extname(path)] ?? "application/octet-stream";
}

export async function startServer(options = {}) {
  await ensureEditorBuild();
  const token = options.token ?? randomBytes(32).toString("base64url");
  const workspace = new SceneWorkspace(new ProjectStore(options.projectRoot ?? join(ROOT, ".axiom/projects")));
  const bus = new CommandBus({ projects: workspace });
  const proposals=new ProposalManager(workspace);await proposals.initialize();
  const view={get project(){return proposals.active.project;},get revision(){return proposals.active.revision;},get workspaceId(){return proposals.previewId;},snapshot:()=>proposals.view()};
  const bridge=new EditorBridge(view,error=>bus.recordError(error));
  bus.agentService=new AgentService({workspace,bus,bridge});bus.agentService.proposals=proposals;
  const runtimeCookie = randomBytes(32).toString("base64url");
  const hash = await schemaHash();
  const startedAt = performance.now();
  let requestCount = 0;
  let rejectedCount = 0;
  let allowedOrigins = new Set();

  const server = createHttpServer(async (request, response) => {
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
        return json(response, 200, { status: "ok", service: "axiom-daemon-bootstrap", version: "0.0.22" });
      }

      if (request.method === "GET" && url.pathname === "/v1/handshake") {
        const requested = Number(request.headers["axiom-protocol-version"] ?? 1);
        if (requested !== 1) return json(response, 409, { code: "AX_PROTOCOL_0003", supported: { min: 1, max: 1 } });
        response.setHeader("Set-Cookie",`axiom-runtime=${runtimeCookie}; HttpOnly; SameSite=Strict; Path=/script-runtime/`);
        return json(response, 200, {
          protocol: { min: 1, max: 1, selected: 1 },
          schemaHash: hash,
          server: { name: "axiom-daemon-bootstrap", version: "0.0.22" },
          capabilities: [...tools.map(t=>"command."+t.name),"events.delta","diagnostics.trace","agent.tools","editor.bridge"],
          limits: { requestBytes: BODY_LIMIT, importBytes: IMPORT_LIMIT, retainedEvents: 512, retainedTraces: 128 }
        });
      }

      if(request.method==='GET'&&url.pathname==='/v1/tools')return json(response,200,{tools:tools.filter(t=>t.mcp)});
      if(request.method==='POST'&&url.pathname==='/v1/editor/sync')return json(response,200,{...bridge.sync(await readJson(request)),proposals:proposals.list()});
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
      const known=typeof error.code==='string'&&/^(AX_AGENT_|AX_SCENE_|AX_WORKSPACE_)/.test(error.code);
      if(known)bus.recordError({code:error.code,cause:error.message});
      return json(response, error.status ?? (known?422:500), { code: known?error.code:error.status === 413 ? "AX_HTTP_0003" : "AX_SYSTEM_0002", cause: error.message });
    }
  });

  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  allowedOrigins = new Set([origin, `http://localhost:${address.port}`]);
  return {
    server,
    token,
    origin,
    editorUrl: `${origin}/#token=${encodeURIComponent(token)}`,
    close: async () => {bridge.close();await proposals.close();return new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));}
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.AXIOM_PORT ? Number(process.env.AXIOM_PORT) : 4317;
  const instance = await startServer({ port });
  console.log(`Axiom daemon bootstrap listening at ${instance.origin}`);
  console.log(`Open editor: ${instance.editorUrl}`);
}
