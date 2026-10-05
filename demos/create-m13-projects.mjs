import {twoDDefaults,component2DDefaults} from '../engine/renderer/two-d-plan.mjs';import {atlasPNG} from './create-m10-projects.mjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
export const PROFILER_CONTROLLER=`using Axiom.Gameplay;
using System.Diagnostics;
namespace Game;
public sealed class GameScript : Script {
 private bool previous;
 public override void OnUpdate(double deltaSeconds) {
  bool pressed=Input.IsDown("Digit1");
  if(pressed&&!previous){var clock=Stopwatch.StartNew();while(clock.Elapsed.TotalMilliseconds<140){ }Log.Info("M13: measured 140ms worker pulse");}
  previous=pressed;
  Entity.Move(new Vec3(Input.Axis("ArrowLeft","ArrowRight"),0,0)*deltaSeconds*2);
 }
}`;
export async function createM13Demos(root,{compile=false,requireScript=false,label='M13',onProgress=()=>{}}={}){
 const w=new SceneWorkspace(new ProjectStore(root)),projects=[],args=x=>({id:w.project.id,expectedSceneRevision:w.revision,...x});
 for(const dimension of [3,2]){await w.run('project.create',{name:dimension===3?`Demo · ${label} Frame Spike Lab`:`Demo · ${label} 2D Pass Timing`});
  if(dimension===2){await w.run('scene.twoD.update',args({value:twoDDefaults}));await w.run('asset.import',args({name:'M13-timing-atlas.png',base64:atlasPNG().toString('base64')}));}
  for(let i=0;i<5;i++){if(dimension===3)await w.run('scene.primitive.create',args({dimension,shape:'cube'}));else await w.run('scene.entity.create',args({name:'Sprite'}));const id=w.project.scene.entities.at(-1).id;if(dimension===2){await w.run('scene.component.add',args({entityId:id,component:'Renderable',value:{kind:'sprite',assetId:w.project.scene.assets.find(a=>a.name==='M13-timing-atlas.png').id}}));await w.run('scene.sprite2D.set',args({entityId:id,value:{...component2DDefaults.sprite2D,columns:8,frame:i%4}}));}
  await w.run('scene.entity.update',args({entityId:id,name:i===0?(dimension===3?'Controller · arrows move, 1 adds one measured pulse':'Reference sprite · edit transform and atlas'):'Measured geometry '+i,transform:{position:[(i-2)*1.3,Math.sin(i),0],scale:[.5,.5,.5]}}));}
  await w.run('scene.camera.update',args({camera:{position:dimension===2?[0,0,9]:[0,2,9],target:[0,0,0],projection:dimension===2?'orthographic':'perspective',fov:60,orthoHeight:6}}));
  const controllerId=w.project.scene.entities[0].id;let scriptStatus='skipped',scriptError;
  if(dimension===3&&compile){onProgress('Compiling the M13 controlled profiler pulse...');try{let job=(await w.run('script.compile',args({source:PROFILER_CONTROLLER,attachments:[controllerId],mode:'development'}))).job;const deadline=Date.now()+180000;while(['queued','running'].includes(job.status)&&Date.now()<deadline){await new Promise(r=>setTimeout(r,200));job=(await w.run('script.job.get',{id:w.project.id,jobId:job.id})).job;}if(job.status!=='completed')throw Error(job.error?.message??'Compilation timed out');scriptStatus='completed';}catch(e){scriptStatus='failed';scriptError=e.message;onProgress(scriptError);if(requireScript)throw e;}}
  await w.run('scene.save',args());projects.push({id:w.project.id,name:w.project.name,controllerId,scriptStatus,...(scriptError?{scriptError}:{})});await w.run('project.close',args());
 }return projects;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){console.log('Creating two editable M13 projects; existing projects are preserved.');console.log(JSON.stringify(await createM13Demos(resolve('.axiom/projects'),{compile:true,onProgress:console.log}),null,2));console.log('Open an M13 project and the Profiler tab. See demos/M13_GUIDE.md.');}
