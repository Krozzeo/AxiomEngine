import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createM183Projects} from './create-m18-3-projects.mjs';
import {HubSettings} from '../daemon/bootstrap/hub-settings.mjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
export async function createApiProject(root,{folders=false}={}){
 const w=new SceneWorkspace(new ProjectStore(root,{folders}));await w.run('project.create',{name:'Demo · M18.3.7 Scripting API Lab',dimension:3});
 const run=(type,data={})=>w.run(type,{id:w.project.id,expectedSceneRevision:w.revision,...data});
 const cube=w.project.scene.entities.find(e=>e.renderable);await run('scene.entity.update',{entityId:cube.id,name:'API Probe',transform:{position:[2,1,0]}});
 await run('scene.collider.set',{entityId:cube.id,value:{dimension:3,shape:'box',halfExtents:[.5,.5,.5],trigger:false,layer:1,mask:4294967295}});
 await run('scene.rigidBody.set',{entityId:cube.id,value:{mass:1,velocity:[0,0,0],restitution:0,friction:.5,gravityScale:0}});
 await run('scene.primitive.create',{dimension:3,shape:'sphere'});const pickup=w.project.scene.entities.at(-1);await run('scene.entity.update',{entityId:pickup.id,name:'Pickup',transform:{position:[2,1,0],scale:[.5,.5,.5]}});
 await run('scene.collider.set',{entityId:pickup.id,value:{dimension:3,shape:'sphere',halfExtents:[.3,.3,.3],trigger:true,layer:1,mask:4294967295}});
 const path='Scripts/ApiCompatibilityProbe.cs';await run('project.files.edit',{action:'create',kind:'script',path});await run('project.files.edit',{action:'write',path,text:await readFile(new URL('./scripts/ApiCompatibilityProbe.cs',import.meta.url),'utf8')});await run('scene.script.edit',{entityId:cube.id,path,action:'attach'});await run('scene.save');return {id:w.project.id,name:w.project.name,cubeId:cube.id,pickupId:pickup.id,scriptPath:path};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const root=(await new HubSettings().load()).projectRoot;const demos=await createM183Projects(undefined,{players:false});demos.push(await createApiProject(root,{folders:true}));console.log(JSON.stringify(demos,null,2));}
