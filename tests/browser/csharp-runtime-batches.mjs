import {scriptMetadata} from '../../engine/scripting/fields.mjs';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,extname} from 'node:path';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {chromium} from 'playwright';
import {ScriptCompiler} from '../../daemon/bootstrap/scripting/compiler.mjs';
import {ProjectStore} from '../../daemon/bootstrap/project-store.mjs';
const root=await mkdtemp(join(tmpdir(),'axiom-csharp-')),compiler=new ScriptCompiler(new ProjectStore(root)),projectId='project://'+randomUUID();
const mode=process.env.AXIOM_CSHARP_MODE??'development';
let browser,server;
try {
 const sources={'Scripts/RuntimeBatchProbe.cs':await readFile(new URL('./RuntimeBatchProbe.cs',import.meta.url),'utf8')};
 const entries=Object.entries(sources).map(([path,text])=>({path,kind:'script',text,metadata:scriptMetadata({path,kind:'script',text})})),source=entries[0].text;
 const build=await compiler.build(projectId,source,mode,undefined,entries);
 server=createServer(async(req,res)=>{try{
  const path=new URL(req.url,'http://localhost').pathname;
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'");
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
  if(path==='/'){res.setHeader('Content-Type','text/html');return res.end('<title>C# gameplay</title>');}
  if(path==='/script-worker.js'){res.setHeader('Content-Type','text/javascript');return res.end(await readFile(new URL('../../engine/scripting/worker.mjs',import.meta.url)));}
  const modules={'/operations.mjs':'engine/scripting/operations.mjs','/fields.mjs':'engine/scripting/fields.mjs','/contract.mjs':'engine/scripting/contract.mjs','/runtime-edit.mjs':'engine/scene/runtime-edit.mjs','/script-files.mjs':'engine/scene/script-files.mjs','/project-files.mjs':'engine/scene/project-files.mjs','/project-document.schema.json':'protocol/schema/project-document.schema.json'};
  if(modules[path]){res.setHeader('Content-Type',path.endsWith('.json')?'application/json':'text/javascript');let source=await readFile(new URL('../../'+modules[path],import.meta.url),'utf8');source=source.replace('../scene/runtime-edit.mjs','./runtime-edit.mjs').replace('../scripting/fields.mjs','./fields.mjs').replaceAll('../scene/','./').replace('../../protocol/schema/project-document.schema.json','./project-document.schema.json');return res.end(source);}
  const name=path.slice('/runtime/'.length);res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.wasm':'application/wasm'})[extname(name)]??'application/octet-stream');res.end(await compiler.read(projectId,build,name));
 }catch(e){res.writeHead(404);res.end(String(e));}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 const results=await page.evaluate(async SOURCE_FILES=>{
  const worker=new Worker('/script-worker.js',{type:'module'});let id=0;
  const send=data=>new Promise((resolve,reject)=>{const ticket=++id;const timer=setTimeout(()=>{worker.terminate();reject(new Error('Script timeout'));},60000);worker.onerror=e=>{clearTimeout(timer);reject(new Error(e.message));};worker.onmessage=({data:r})=>{if(r.id!==ticket)return;clearTimeout(timer);r.error?reject(new Error(r.error)):resolve(r.result??r);};worker.postMessage({...data,id:ticket});});
  try {
   await send({type:'initialize',url:'/runtime/dotnet.js'});
   const entity={id:'entity://11111111-1111-4111-8111-111111111111',name:'Root',camera:{active:true,projection:'perspective',fov:60,orthoHeight:6},transform:{position:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]},collider:{dimension:3,shape:'box',halfExtents:[.5,.5,.5],trigger:false,layer:1,mask:4294967295},rigidBody:{mass:1,velocity:[0,0,0],angularVelocity:[0,0,.25],restitution:0,friction:.5,gravityScale:0},scriptComponents:[{path:'Scripts/RuntimeBatchProbe.cs',values:{}}]};
   const tr={position:[3,0,0],rotation:[0,0,0,1],scale:[1,1,1]},resource=id=>({id:'entity://22222222-2222-4222-8222-'+String(id).padStart(12,'0'),name:id===1?'Prefab cube':'Prefab child',transform:tr,...(id===2?{runtimeParentId:'entity://22222222-2222-4222-8222-000000000001'}:{})});
   const resources=[{path:'Assets/Settings.json',type:'text',text:'{"difficulty":2}'},{path:'Assets/Test.prefab.json',type:'prefab',text:'{}',entities:[resource(1),resource(2)]},{path:'Scenes/Arena.scene.json',type:'scene',text:'{}',entities:[{...resource(3),name:'Arena cube'}]}];
   let entities=[entity],packets=[],frame=0;const dispatch=async(action,delta=.02)=>{const result=await send({request:{generation:1,entities,keys:frame===1?['KeyE','F1']:[],attachments:[entity.id],action,delta,projectData:{name:'Source',resources},preferences:{score:'7'},input:frame===1?{buttons:['Mouse0'],mousePosition:[120,80],mouseScrollDelta:[0,2],gamepads:[{index:0,name:'Controlled pad',axes:[.9],buttons:[0,1]}],touches:[{fingerId:1,position:[10,20],deltaPosition:[0,0],phase:'Began',pressure:1}]}:{buttons:[],touches:[{fingerId:1,position:[10,20],deltaPosition:[0,0],phase:'Ended',pressure:0}]}
}});if(result.error)throw Error(result.error);packets.push(result);return result;};
   // Apply the actual SDK operations between phases, just as the editor host does.
   const {applyScriptOperations,runtimeScriptEntities}=await import('/operations.mjs');let scene={entities,projectFiles:SOURCE_FILES},spawned=0;
   const phase=async(action,delta)=>{const result=await dispatch(action,delta),next=applyScriptOperations(scene,result,1,spawned);scene=next.scene;spawned=next.spawned;entities=runtimeScriptEntities(scene.entities,[]);return result;};
   await phase('start');frame=1;await phase('frame',.02);await phase('update');frame=2;await phase('frame',.02);await phase('update');
   const state=packets.at(-1).scriptValues.find(s=>s.path==='Scripts/RuntimeBatchProbe.cs').values;
   const preferences=packets.flatMap(p=>p.operations).filter(o=>o.kind==='preferences').at(-1).data;
   await phase('stop');return {state,preferences};
  }finally{worker.terminate();}
 },entries.map(({path,text,kind})=>({path,text,kind})));
 assert.ok(results.state.Checks>=26,JSON.stringify(results));assert.equal(results.state.Frames,2);assert.equal(results.preferences.score,'8');assert.ok(results.preferences.bindings.includes('Interact'));console.log('CSHARP_RUNTIME_BATCHES='+JSON.stringify({passed:true,mode,...results}));
}finally{await browser?.close();if(server)await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});}
