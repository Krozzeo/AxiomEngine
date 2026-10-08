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
 const source=(await readFile(new URL('../../engine/scripting/templates/Game.cs',import.meta.url),'utf8')).replace('class GameScript : Script','class NamedController : Script');
 const probe='using Axiom.Gameplay; namespace Game; public sealed class InspectorProbe : MonoBehaviour { [SerializeField] private Vector3 Offset=new Vector3(0,0,0); [ReadOnly] public int Frames=0; public Vector2Int Cell=new Vector2Int(0,0); public Color Tint=new Color(1,1,1,1); public override void OnStart(){Debug.Log("Hydrated="+Offset.X+","+Cell.Y);} public override void OnUpdate(double deltaSeconds){Frames++;} }';
 const entries=[{path:'Scripts/NamedController.cs',kind:'script',text:source},{path:'Scripts/InspectorProbe.cs',kind:'script',text:probe}].map(f=>({...f,metadata:scriptMetadata(f)}));
 const build=await compiler.build(projectId,source,mode,undefined,entries);
 server=createServer(async(req,res)=>{try{
  const path=new URL(req.url,'http://localhost').pathname;
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'");
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
  if(path==='/'){res.setHeader('Content-Type','text/html');return res.end('<title>C# gameplay</title>');}
  if(path==='/script-worker.js'){res.setHeader('Content-Type','text/javascript');return res.end(await readFile(new URL('../../engine/scripting/worker.mjs',import.meta.url)));}
  const name=path.slice('/runtime/'.length);res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.wasm':'application/wasm'})[extname(name)]??'application/octet-stream');res.end(await compiler.read(projectId,build,name));
 }catch(e){res.writeHead(404);res.end(String(e));}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 const results=await page.evaluate(async()=>{
  const worker=new Worker('/script-worker.js',{type:'module'});let id=0;
  const send=data=>new Promise((resolve,reject)=>{const ticket=++id;const timer=setTimeout(()=>{worker.terminate();reject(new Error('Script timeout'));},60000);worker.onerror=e=>{clearTimeout(timer);reject(new Error(e.message));};worker.onmessage=({data:r})=>{if(r.id!==ticket)return;clearTimeout(timer);r.error?reject(new Error(r.error)):resolve(r.result??r);};worker.postMessage({...data,id:ticket});});
  try {
   await send({type:'initialize',url:'/runtime/dotnet.js'});
   const entity={id:'entity://11111111-1111-4111-8111-111111111111',name:'Player',transform:{position:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]},scriptComponents:[{path:'Scripts/NamedController.cs',values:{}},{path:'Scripts/InspectorProbe.cs',values:{Offset:[7,2,3],Cell:[4,9],Frames:0,Tint:[.2,.7,1,1]}}]};
   const base={generation:1,entities:[entity],keys:[],attachments:[entity.id]};
   const start=await send({request:{...base,action:'start'}});
   const step=await send({request:{...base,action:'step',delta:.25,keys:['ArrowRight']}});
   const changed=await send({request:{...base,action:'fields',edits:[{entityId:entity.id,path:'Scripts/InspectorProbe.cs',values:{Offset:[2,4,6],Cell:[8,12]}}]}});
   const after=await send({request:{...base,action:'step',delta:.1}});
   const stop=await send({request:{...base,action:'stop'}});
   return {start,step,changed,after,stop};
  }finally{worker.terminate();}
 });
 for(const r of Object.values(results))assert.equal(r.error,undefined,JSON.stringify(r));
 assert.ok(results.start.operations.some(o=>o.kind==='log'));assert.ok(results.start.operations.some(o=>o.kind==='spawn'));
 assert.deepEqual(results.step.operations.find(o=>o.kind==='move').position,[.5,0,0]);assert.ok(results.stop.operations.some(o=>o.message==='C# stopped'));
 assert.ok(results.start.operations.some(o=>o.message==='Hydrated=7,9'));
 const fields=results.step.scriptValues.find(c=>c.path==='Scripts/InspectorProbe.cs').values;assert.equal(fields.Frames,1);assert.deepEqual(fields.Offset,[7,2,3]);assert.deepEqual(fields.Cell,[4,9]);assert.deepEqual(fields.Tint,[.2,.7,1,1]);
 const live=results.after.scriptValues.find(c=>c.path==='Scripts/InspectorProbe.cs').values;assert.deepEqual(live.Offset,[2,4,6]);assert.deepEqual(live.Cell,[8,12]);assert.equal(live.Frames,2);
 console.log('CSHARP_GAMEPLAY='+JSON.stringify({passed:true,mode,build,results}));
}finally{await browser?.close();if(server)await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});}
