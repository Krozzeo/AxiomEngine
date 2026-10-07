import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
export async function createM16Projects(root=resolve('.axiom/projects')){
 const w=new SceneWorkspace(new ProjectStore(root)),result=[];
 const args=value=>({id:w.project.id,expectedSceneRevision:w.revision,...value});
 await w.run('project.create',{name:'Demo · M16 Editor & File Workshop',dimension:3});
 for(const path of ['Scripts/Gameplay','Assets/Examples'])await w.run('project.files.edit',args({action:'create',kind:'folder',path}));
 await w.run('project.files.edit',args({action:'create',kind:'script',path:'Scripts/Gameplay/WorkshopController.cs'}));
 await w.run('project.files.edit',args({action:'create',kind:'json',path:'Assets/Examples/Settings.json'}));
 await w.run('scene.rendering.update',args({value:{...w.project.scene.rendering,environment:[.12,.16,.24]}}));
 for(const shape of ['sphere','capsule'])await w.run('scene.primitive.create',args({dimension:3,shape}));
 const items=w.project.scene.entities.filter(e=>e.renderable);for(const [i,e]of items.entries())await w.run('scene.entity.update',args({entityId:e.id,transform:{position:[(i-1)*2.5,0,0]}}));
 await w.run('scene.save',args());result.push({id:w.project.id,name:w.project.name});await w.run('project.close',args());
 await w.run('project.create',{name:'Demo · M16 Low-End Instance Grid',dimension:3});
 const cube=w.project.scene.entities.find(e=>e.renderable),copies=[];
 for(let i=1;i<256;i++){const id='entity://'+crypto.randomUUID();copies.push({...structuredClone(cube),id,name:'Grid cube '+i,transform:{position:[(i%16-7.5)*1.3,Math.floor(i/16)*1.3,0],rotation:[0,0,0,1],scale:[.8,.8,.8]}});}
 await w.run('scene.entity.update',args({entityId:cube.id,name:'Grid cube 0',transform:{position:[-7.5*1.3,0,0],scale:[.8,.8,.8]}}));
 await w.run('scene.entities.paste',args({entities:copies}));
 const camera=w.project.scene.entities.find(e=>e.camera);await w.run('scene.entity.update',args({entityId:camera.id,transform:{position:[0,10,36],rotation:[0,0,0,1]}}));
 await w.run('scene.rendering.update',args({value:{...w.project.scene.rendering,tier:'low',renderScale:.5,culling:'cpu',environment:[.12,.16,.24],bloom:0,shadows:false}}));
 await w.run('scene.save',args());result.push({id:w.project.id,name:w.project.name,instances:256,renderScale:.5});
 return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){console.log(JSON.stringify(await createM16Projects(),null,2));console.log('Open a demo in Saved projects. See demos/M16_GUIDE.md.');}
