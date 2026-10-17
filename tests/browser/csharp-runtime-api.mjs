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
 const sources={
 'Scripts/RuntimeProbe.cs':`using Axiom.Gameplay;using System.Collections;using Object=Axiom.Gameplay.Object;namespace Game;
 public sealed class RuntimeProbe : MonoBehaviour {
  public bool Paused=false;[ReadOnly] public int Updates=0;[ReadOnly] public int Fixed=0;[ReadOnly] public int Scaled=0;[ReadOnly] public int Unscaled=0;[ReadOnly] public int Invoked=0;
  public static bool ObserverUpdated; private GameObject? child;private GameObject? cloned;private Coroutine? running;
  private static void Check(bool value,string why){if(!value)throw new System.Exception(why);}
  public override void Awake(){Debug.Log("awake-probe");}
  public override void Start(){
   Check(Camera.main!=null,"main camera missing");transform.position=new Vector3(10,0,0);
   child=new GameObject("Runtime Child");child.transform.SetParent(transform,false);child.transform.localPosition=new Vector3(1,2,0);
   Check(Vector3.Distance(child.transform.position,new Vector3(11,2,0))<.00001,"local/world transform");
   child.tag="Player";child.layer=4;Check(GameObject.FindWithTag("Player")!.name==child.name,"tag query");
   var collider=child.AddComponent<BoxCollider>();var body=child.AddComponent<Rigidbody>();Object.Destroy(body);Check(child.GetComponent<Rigidbody>()==null&&child.GetComponent<BoxCollider>()!=null,"remove component destroyed object");
   var bodyOnly=new GameObject("2D body");Check(bodyOnly.AddComponent<Rigidbody2D>()!=null,"body-only 2D facade");Check(bodyOnly.AddComponent<BoxCollider2D>()!=null,"2D collider attachment");Object.Destroy(bodyOnly);
   var extra=child.AddComponent<Extra>();extra.Value=7;
   var grandchild=new GameObject("Nested");grandchild.transform.SetParent(child.transform,false);grandchild.transform.localPosition=new Vector3(0,1,0);
   var clone=Object.Instantiate(child,new Vector3(20,2,0),Quaternion.identity);Check(clone.name==child.name+" (clone)","clone root name");Check(clone.transform.childCount==1,"hierarchy cloning");Check(clone.GetComponent<Extra>()!.Value==7,"cloned serialized fields");Check(clone.transform.GetChild(0).position.Y==3,"clone child pose");
   cloned=clone;
   transform.position=new Vector3(12,0,0);Check(child.transform.position.X==13,"live child propagation");
   running=StartCoroutine(ScaledRoutine());StartCoroutine(RealtimeRoutine());Invoke(nameof(Ping),.04);InvokeRepeating(nameof(Repeat),.02,.02);CancelInvoke(nameof(Repeat));
   Check(IsInvoking(nameof(Ping))&&!IsInvoking(nameof(Repeat)),"invoke cancel");
  }
  private IEnumerator ScaledRoutine(){yield return new WaitForSeconds(.04);Scaled++;yield return new WaitForFixedUpdate();Fixed++;yield return new WaitForEndOfFrame();Debug.Log("end-frame");}
  private IEnumerator RealtimeRoutine(){yield return new WaitForSecondsRealtime(.04);Unscaled++;yield return new WaitUntil(()=>Updates>=1);yield return null;Debug.Log("coroutine-finished");}
  private void Ping(){Invoked++;}private void Repeat(){throw new System.Exception("cancelled invocation executed");}
  public override void FixedUpdate(){Check(Time.inFixedTimeStep&&Time.deltaTime==Time.fixedDeltaTime,"fixed time mismatch");Fixed++;}
  public override void Update(){Updates++;ObserverUpdated=false;if(Updates==1){Check(cloned!.transform.Find("Nested")!=null,"clone child name changed across host phases");Object.Destroy(cloned);Check(!cloned,"destroyed handle truthiness");}if(Updates==7){StartCoroutine(ScaledRoutine());StartCoroutine(RealtimeRoutine());Invoke(nameof(Ping),.04);}Time.timeScale=Paused?0:1;}
  public override void LateUpdate(){Check(ObserverUpdated,"LateUpdate ran before all Updates");}
 }
`,
 'Scripts/Observer.cs':`using Axiom.Gameplay;namespace Game;public sealed class Observer : MonoBehaviour {public override void Awake(){Debug.Log("awake-observer");}public override void Update(){RuntimeProbe.ObserverUpdated=true;}}`,
 'Scripts/Extra.cs':`using Axiom.Gameplay;namespace Game;public sealed class Extra : MonoBehaviour {[Range(0,3)] public int Value=1;public override void Awake(){Debug.Log("extra-awake");}}`
 };
 const entries=Object.entries(sources).map(([path,text])=>({path,kind:'script',text,metadata:scriptMetadata({path,kind:'script',text})})),source=entries[0].text;
 const build=await compiler.build(projectId,source,mode,undefined,entries);
 server=createServer(async(req,res)=>{try{
  const path=new URL(req.url,'http://localhost').pathname;
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'");
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
  if(path==='/'){res.setHeader('Content-Type','text/html');return res.end('<title>C# gameplay</title>');}
  if(path==='/script-worker.js'){res.setHeader('Content-Type','text/javascript');return res.end(await readFile(new URL('../../engine/scripting/worker.mjs',import.meta.url)));}
  const modules={'/operations.mjs':'engine/scripting/operations.mjs','/fields.mjs':'engine/scripting/fields.mjs','/references.mjs':'engine/scripting/references.mjs','/contract.mjs':'engine/scripting/contract.mjs','/runtime-edit.mjs':'engine/scene/runtime-edit.mjs','/script-files.mjs':'engine/scene/script-files.mjs','/project-files.mjs':'engine/scene/project-files.mjs','/project-document.schema.json':'protocol/schema/project-document.schema.json'};
  if(modules[path]){res.setHeader('Content-Type',path.endsWith('.json')?'application/json':'text/javascript');let source=await readFile(new URL('../../'+modules[path],import.meta.url),'utf8');source=source.replace('../scene/runtime-edit.mjs','./runtime-edit.mjs').replace('../scripting/fields.mjs','./fields.mjs').replace('../scripting/references.mjs','./references.mjs').replaceAll('../scene/','./').replace('../../protocol/schema/project-document.schema.json','./project-document.schema.json');return res.end(source);}
  const name=path.slice('/runtime/'.length);res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.wasm':'application/wasm'})[extname(name)]??'application/octet-stream');res.end(await compiler.read(projectId,build,name));
 }catch(e){res.writeHead(404);res.end(String(e));}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 const results=await page.evaluate(async SOURCE_FILES=>{
  const worker=new Worker('/script-worker.js',{type:'module'});let id=0;
  const send=data=>new Promise((resolve,reject)=>{const ticket=++id;const timer=setTimeout(()=>{worker.terminate();reject(new Error('Script timeout'));},60000);worker.onerror=e=>{clearTimeout(timer);reject(new Error(e.message));};worker.onmessage=({data:r})=>{if(r.id!==ticket)return;clearTimeout(timer);r.error?reject(new Error(r.error)):resolve(r.result??r);};worker.postMessage({...data,id:ticket});});
  try {
   await send({type:'initialize',url:'/runtime/dotnet.js'});
   const entity={id:'entity://11111111-1111-4111-8111-111111111111',name:'Root',camera:{active:true,projection:'perspective',fov:60,orthoHeight:6},transform:{position:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]},scriptComponents:[{path:'Scripts/RuntimeProbe.cs',values:{}},{path:'Scripts/Observer.cs',values:{}}]};
   let entities=[entity],packets=[];const dispatch=async(action,delta=.02)=>{const result=await send({request:{generation:1,entities,keys:[],attachments:[entity.id],action,delta}});if(result.error)throw Error(result.error);packets.push(result);return result;};
   // Apply the actual SDK operations between phases, just as the editor host does.
   const {applyScriptOperations,runtimeScriptEntities}=await import('/operations.mjs');let scene={entities,projectFiles:SOURCE_FILES},spawned=0;
   const phase=async(action,delta)=>{const result=await dispatch(action,delta),next=applyScriptOperations(scene,result,1,spawned);scene=next.scene;spawned=next.spawned;entities=runtimeScriptEntities(scene.entities,[]);return result;};
   await phase('start');for(let frame=0;frame<6;frame++){await phase('frame',.02);await phase('fixed');await phase('physics');await phase('update');await phase('late');await phase('end');}
   const values=()=>packets.at(-1).scriptValues.find(s=>s.path==='Scripts/RuntimeProbe.cs').values;
   const state=values();const edit=async Paused=>{const result=await send({request:{generation:1,entities,keys:[],action:'fields',edits:[{entityId:entity.id,path:'Scripts/RuntimeProbe.cs',values:{Paused}}]}});if(result.error)throw Error(result.error);};
   const frame=async()=>{await phase('frame',.02);if(packets.at(-1).time.scale>0){await phase('fixed');await phase('physics');}await phase('update');await phase('late');await phase('end');};
   await edit(true);for(let i=0;i<5;i++)await frame();const paused=values();
   await edit(false);for(let i=0;i<5;i++)await frame();const resumed=values();await phase('stop');return {state,paused,resumed,packets};
  }finally{worker.terminate();}
 },entries.map(({path,text,kind})=>({path,text,kind})));
 assert.equal(results.state.Updates,6);assert.ok(results.state.Fixed>=6);assert.equal(results.state.Scaled,1);assert.equal(results.state.Unscaled,1);assert.equal(results.state.Invoked,1);assert.equal(results.paused.Scaled,1);assert.equal(results.paused.Unscaled,2);assert.equal(results.paused.Invoked,1);assert.equal(results.resumed.Scaled,2);assert.equal(results.resumed.Invoked,2);console.log('CSHARP_RUNTIME_API='+JSON.stringify({passed:true,mode,state:results.state}));
}finally{await browser?.close();if(server)await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});}
