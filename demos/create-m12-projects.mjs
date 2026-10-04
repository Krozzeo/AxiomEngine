import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';import {audioDefaults,sourceDefaults} from '../engine/audio/plan.mjs';import {toneWav} from './audio-wav.mjs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
export const AUDIO_CONTROLLER=`using Axiom.Gameplay;
namespace Game;
public sealed class GameScript : Script {
 private bool restart;
 public override void OnUpdate(double deltaSeconds) {
  Entity.Move(new Vec3(Input.Axis("ArrowLeft","ArrowRight"),0,0)*deltaSeconds*3);
  if(Input.IsDown("Digit1"))Entity.PauseAudio();
  if(Input.IsDown("Digit2"))Entity.ResumeAudio();
  if(Input.IsDown("Digit3"))Entity.StopAudio();
  bool pressed=Input.IsDown("Digit4");if(pressed&&!restart)Entity.PlayAudio();restart=pressed;
  if(Input.IsDown("Digit5"))Entity.SetAudioVolume(0.1);
 }
}`;
export async function createM12Demos(root,{compile=false,requireScript=false,onProgress=()=>{}}={}){const w=new SceneWorkspace(new ProjectStore(root)),projects=[],args=x=>({id:w.project.id,expectedSceneRevision:w.revision,...x});async function entity(name,position){await w.run('scene.entity.create',args({name}));const id=w.project.scene.entities.at(-1).id;await w.run('scene.entity.update',args({entityId:id,transform:{position}}));return id;}
 for(const spatial of [true,false]){await w.run('project.create',{name:spatial?'Demo · M12 Spatial Sound Stage':'Demo · M12 Streaming Mixer Lab'});await w.run('scene.audio.update',args({value:audioDefaults}));await w.run('asset.import',args({name:spatial?'spatial-tone.wav':'stream-music.wav',base64:toneWav({duration:spatial?3:90,frequency:spatial?440:220,channels:spatial?1:2}).toString('base64')}));const assetId=w.project.scene.assets[0].id;
 const listener=await entity('Listener · origin, facing -Z',[0,0,0]);await w.run('scene.audioListener.set',args({entityId:listener,value:{enabled:true}}));await w.run('scene.primitive.create',args({dimension:3,shape:'sphere'}));const sourceId=w.project.scene.entities.at(-1).id;await w.run('scene.entity.update',args({entityId:sourceId,name:spatial?'Sound sphere · Arrow keys move source':'Streaming music · select AudioSource',transform:{position:spatial?[-3,0,-2]:[0,0,0],scale:[.5,.5,.5]}}));await w.run('scene.audioSource.set',args({entityId:sourceId,value:{...sourceDefaults,assetId,bus:spatial?'Effects':'Music',loop:true,stream:!spatial,spatial}}));
 let shotId=null;if(!spatial){await w.run('asset.import',args({name:'short-effect.wav',base64:toneWav({duration:1,frequency:880}).toString('base64')}));shotId=await entity('One-shot · click play audio',[2,0,0]);await w.run('scene.audioSource.set',args({entityId:shotId,value:{...sourceDefaults,assetId:w.project.scene.assets.find(a=>a.name==='short-effect.wav').id,bus:'Effects',autoplay:false}}));}
 await w.run('scene.camera.update',args({camera:{position:[0,3,8],target:[0,0,-1],projection:'perspective',fov:60,orthoHeight:6}}));let scriptStatus='skipped',scriptError;if(spatial&&compile){onProgress('Compiling M12 audio controller...');try{let job=(await w.run('script.compile',args({source:AUDIO_CONTROLLER,attachments:[sourceId],mode:'development'}))).job;const end=Date.now()+180000;while(['queued','running'].includes(job.status)&&Date.now()<end){await new Promise(r=>setTimeout(r,200));job=(await w.run('script.job.get',{id:w.project.id,jobId:job.id})).job;}if(job.status!=='completed')throw Error(job.error?.message??'Audio controller compilation timed out');scriptStatus='completed';}catch(e){scriptStatus='failed';scriptError=e.message;onProgress('C# controller unavailable: '+e.message);if(requireScript)throw e;}}
 await w.run('scene.save',args());projects.push({id:w.project.id,name:w.project.name,sourceId,listenerId:listener,shotId,scriptStatus,...(scriptError?{scriptError}:{})});await w.run('project.close',args());}
 return projects;}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){console.log('Creating two M12 demos; existing projects are preserved.');console.log(JSON.stringify(await createM12Demos(resolve('.axiom/projects'),{compile:true,onProgress:console.log}),null,2));console.log('Open M12 projects from Archivo → Proyectos. See demos/M12_GUIDE.md.');}
