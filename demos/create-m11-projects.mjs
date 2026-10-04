import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {animationGlb,demoAnimator} from './animation-glb.mjs';
import {atlasPNG} from './create-m10-projects.mjs';
import {twoDDefaults,component2DDefaults} from '../engine/renderer/two-d-plan.mjs';
import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
export const ANIMATION_CONTROLLER=`using Axiom.Gameplay;
public sealed class AnimationController : Script {
 private bool bounce;
 private string? previous;
 public override void OnUpdate(double deltaSeconds) {
  if(Input.IsDown("Digit1"))Entity.SetAnimationParameter("energy",1);
  if(Input.IsDown("Digit2"))Entity.SetAnimationParameter("energy",0);
  bool pressed=Input.IsDown("Digit3");if(pressed&&!bounce)Entity.PlayAnimation("Bounce",0.5);bounce=pressed;
  if(Input.IsDown("KeyP"))Entity.PauseAnimation();
  if(Input.IsDown("KeyR"))Entity.ResumeAnimation();
  if(Entity.CurrentAnimation!=previous){previous=Entity.CurrentAnimation;Log.Info("Animation observed: "+previous);}
 }
}`;
export async function createM11Demos(root,{compile=false,requireScript=false,onProgress=()=>{}}={}){const w=new SceneWorkspace(new ProjectStore(root)),projects=[],args=x=>({id:w.project.id,expectedSceneRevision:w.revision,...x});
 async function entity(name,position){await w.run('scene.entity.create',args({name}));const e=w.project.scene.entities.at(-1);await w.run('scene.entity.update',args({entityId:e.id,transform:{position}}));return e.id;}
 async function finish(extra={}){await w.run('scene.save',args());projects.push({id:w.project.id,name:w.project.name,...extra});await w.run('project.close',args());}
 for(const skinned of [true,false]){await w.run('project.create',{name:skinned?'Demo · M11 Skinned Robot Studio':'Demo · M11 Clip and State Lab'});await w.run('asset.import',args({name:skinned?'three-joint-robot.glb':'animated-block.glb',base64:animationGlb({skinned}).toString('base64')}));const assetId=w.project.scene.assets[0].id;const ids=[];
  for(let i=0;i<2;i++){const id=await entity(i===0?'Animated · select Animator controls':'Paused · resume to animate',[(i-.5)*3,0,0]);ids.push(id);await w.run('scene.component.add',args({entityId:id,component:'Renderable',value:{assetId,kind:'mesh'}}));await w.run('scene.animator.set',args({entityId:id,value:demoAnimator('Idle',i===0)}));}
  await w.run('scene.camera.update',args({camera:{position:[4,3,9],target:[0,1,0],projection:'perspective',fov:45,orthoHeight:6}}));let scriptStatus='skipped',scriptError;
  if(skinned&&compile){onProgress('Compiling M11 C# animation controller...');try{let job=(await w.run('script.compile',args({source:ANIMATION_CONTROLLER,attachments:[ids[0]],mode:'development'}))).job;const end=Date.now()+180000;while(['queued','running'].includes(job.status)&&Date.now()<end){await new Promise(r=>setTimeout(r,200));job=(await w.run('script.job.get',{id:w.project.id,jobId:job.id})).job;}if(['queued','running'].includes(job.status)){await w.run('script.job.cancel',{id:w.project.id,jobId:job.id});throw Error('Animation controller compilation timed out');}if(job.status!=='completed')throw Error(job.error?.message??'Compilation failed');scriptStatus='completed';}catch(error){scriptStatus='failed';scriptError=error.message;onProgress('C# unavailable: '+error.message+'; Inspector and AI controls remain available.');if(requireScript)throw error;}}
  await finish({animatedId:ids[0],pausedId:ids[1],...(skinned?{scriptStatus,...(scriptError?{scriptError}:{})}:{})});
 }
 await w.run('project.create',{name:'Demo · M11 Pixel Scene Clarity'});await w.run('scene.twoD.update',args({value:{...twoDDefaults,ambient:[1,1,1]}}));await w.run('asset.import',args({name:'pixel-atlas.png',base64:atlasPNG().toString('base64')}));const id=await entity('Pixel mascot · compare Scene and Game',[0,0,0]);await w.run('scene.component.add',args({entityId:id,component:'Renderable',value:{kind:'sprite',assetId:w.project.scene.assets[0].id}}));await w.run('scene.sprite2D.set',args({entityId:id,value:{...component2DDefaults.sprite2D,columns:8,rows:1,frame:4,size:[2,2],lit:false}}));await finish();return projects;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){console.log('Creating three M11 demos; existing projects are preserved.');console.log(JSON.stringify(await createM11Demos(resolve('.axiom/projects'),{compile:true,onProgress:console.log}),null,2));console.log('Open from Archivo → Proyectos. See demos/M11_GUIDE.md.');}
