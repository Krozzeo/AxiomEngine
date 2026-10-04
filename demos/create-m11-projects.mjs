import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {animationGlb,demoAnimator} from './animation-glb.mjs';
import {atlasPNG} from './create-m10-projects.mjs';
import {twoDDefaults,component2DDefaults} from '../engine/renderer/two-d-plan.mjs';
import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
export async function createM11Demos(root){const w=new SceneWorkspace(new ProjectStore(root)),projects=[],args=x=>({id:w.project.id,expectedSceneRevision:w.revision,...x});
 async function entity(name,position){await w.run('scene.entity.create',args({name}));const e=w.project.scene.entities.at(-1);await w.run('scene.entity.update',args({entityId:e.id,transform:{position}}));return e.id;}
 async function finish(extra={}){await w.run('scene.save',args());projects.push({id:w.project.id,name:w.project.name,...extra});await w.run('project.close',args());}
 for(const skinned of [true,false]){await w.run('project.create',{name:skinned?'Demo · M11 Skinned Robot Studio':'Demo · M11 Clip and State Lab'});await w.run('asset.import',args({name:skinned?'three-joint-robot.glb':'animated-block.glb',base64:animationGlb({skinned}).toString('base64')}));const assetId=w.project.scene.assets[0].id;const ids=[];
  for(let i=0;i<2;i++){const id=await entity(i===0?'Animated · select Animator controls':'Paused · resume to animate',[(i-.5)*3,0,0]);ids.push(id);await w.run('scene.component.add',args({entityId:id,component:'Renderable',value:{assetId,kind:'mesh'}}));await w.run('scene.animator.set',args({entityId:id,value:demoAnimator('Idle',i===0)}));}
  await w.run('scene.camera.update',args({camera:{position:[4,3,9],target:[0,1,0],projection:'perspective',fov:45,orthoHeight:6}}));await finish({animatedId:ids[0],pausedId:ids[1]});
 }
 await w.run('project.create',{name:'Demo · M11 Pixel Scene Clarity'});await w.run('scene.twoD.update',args({value:{...twoDDefaults,ambient:[1,1,1]}}));await w.run('asset.import',args({name:'pixel-atlas.png',base64:atlasPNG().toString('base64')}));const id=await entity('Pixel mascot · compare Scene and Game',[0,0,0]);await w.run('scene.component.add',args({entityId:id,component:'Renderable',value:{kind:'sprite',assetId:w.project.scene.assets[0].id}}));await w.run('scene.sprite2D.set',args({entityId:id,value:{...component2DDefaults.sprite2D,columns:8,rows:1,frame:4,size:[2,2],lit:false}}));await finish();return projects;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){console.log('Creating three M11 demos; existing projects are preserved.');console.log(JSON.stringify(await createM11Demos(resolve('.axiom/projects')),null,2));console.log('Open from Archivo → Proyectos. See demos/M11_GUIDE.md.');}
