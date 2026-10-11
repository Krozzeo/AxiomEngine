import {readFile} from 'node:fs/promises';
import {projectFiles} from '../../engine/scene/project-files.mjs';
import {sourceDefaults,audioDefaults} from '../../engine/audio/plan.mjs';
export const playerExamples={'3D First Person Player':'AxiomFirstPersonPlayer','3D Third Person Player':'AxiomThirdPersonPlayer','2D Platform Player':'AxiomPlatformPlayer','2D RPG Player':'AxiomRpgPlayer'};
export async function createPlayer(w,name,parentId){const before=structuredClone(w.project),past=structuredClone(w.past),future=structuredClone(w.future);try{const result=await buildPlayer(w,name,parentId);w.past=[...past,structuredClone(before.scene)].slice(-64);w.future=[];return result;}catch(error){w.project=before;w.past=past;w.future=future;w.revision++;throw error;}}
async function buildPlayer(w,name,parentId){
 const type=playerExamples[name],dimension=name.startsWith('3D')?3:2;if(!type)throw Error('Unknown Player preset');if((w.project.scene.twoD?2:3)!==dimension)throw Error('Create this Player in a '+dimension+'D project');
 const run=(command,args={})=>w.run(command,{id:w.project.id,expectedSceneRevision:w.revision,...args});
 const folders=['Scripts/Players'];for(const path of folders)if(!projectFiles(w.project.scene).some(f=>f.path===path))await run('project.files.edit',{action:'create',kind:'folder',path});
 const source=await readFile(new URL('../../engine/scripting/players/'+type+'.cs',import.meta.url),'utf8'),scriptPath='Scripts/Players/'+type+'.cs';
 if(!projectFiles(w.project.scene).some(f=>f.path===scriptPath)){await run('project.files.edit',{action:'create',kind:'script',path:scriptPath});await run('project.files.edit',{action:'write',path:scriptPath,text:source});}
 await run('scene.entity.create',{name});const root=w.project.scene.entities.at(-1).id;
 await run('scene.entity.update',{entityId:root,name,transform:{position:[0,1,0],scale:[1,1,1]}});
 await run('scene.collider.set',{entityId:root,value:{dimension,shape:'box',halfExtents:dimension===3?[.25,.5,.25]:[.5,.5,.5],trigger:false,layer:1,mask:4294967295}});
 await run('scene.rigidBody.set',{entityId:root,value:{mass:1,velocity:[0,0,0],restitution:0,friction:.1,gravityScale:name==='2D RPG Player'?0:1,freezeRotation:true,angularVelocity:[0,0,0]}});
 await run('scene.primitive.create',{dimension,shape:dimension===3?'capsule':'square'});const graphic=w.project.scene.entities.at(-1).id;await run('scene.entity.update',{entityId:graphic,name:'Graphics',transform:{position:[0,1,0]}});await run('scene.entity.reparent',{entityIds:[graphic],parentId:root});
 // A real silent PCM clip keeps the AudioSource valid without unexpected autoplay.
 const wav=playerSilence();
 await run('asset.import',{name:'Player Audio Placeholder.wav',base64:wav.toString('base64')});const clip=w.project.scene.assets.at(-1).id;
 await run('scene.audioSource.set',{entityId:root,value:{...sourceDefaults,assetId:clip,autoplay:false,spatial:dimension===3}});
 await run('scene.script.edit',{entityId:root,path:scriptPath,action:'attach'});
 if(dimension===3){await run('scene.example.create',{example:'Camera'});const camera=w.project.scene.entities.at(-1).id;await run('scene.entity.update',{entityId:camera,name:name==='3D First Person Player'?'First Person Camera':'Orbit Camera',transform:{position:[0,1.65,name==='3D First Person Player'?-.35:4],rotation:[0,0,0,1],scale:[1,1,1]}});await run('scene.entity.reparent',{entityIds:[camera],parentId:root});}
 else {for(const e of w.project.scene.entities.filter(e=>e.audioListener?.enabled))await run('scene.audioListener.set',{entityId:e.id,value:{enabled:false}});await run('scene.audioListener.set',{entityId:root,value:{enabled:true}});}
 if(parentId)await run('scene.entity.reparent',{entityIds:[root],parentId});return w.snapshot();
}

export function playerSilence(){const wav=Buffer.alloc(44+800);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(800,40);return wav;}
