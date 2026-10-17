import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {HubSettings} from '../daemon/bootstrap/hub-settings.mjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
export async function createRuntimeApiProject(root,{folders=false,label='M18.3.8'}={}){
 const w=new SceneWorkspace(new ProjectStore(root,{folders}));await w.run('project.create',{name:`Demo · ${label} Runtime API Lab`,dimension:3});
 const run=(type,data={})=>w.run(type,{id:w.project.id,expectedSceneRevision:w.revision,...data}),cube=w.project.scene.entities.find(e=>e.renderable);
 await run('scene.entity.update',{entityId:cube.id,name:'Runtime API Probe',transform:{position:[0,1,0]}});
 const path='Scripts/RuntimeApiLab.cs';await run('project.files.edit',{action:'create',kind:'script',path});await run('project.files.edit',{action:'write',path,text:await readFile(new URL('./scripts/RuntimeApiLab.cs',import.meta.url),'utf8')});await run('scene.script.edit',{entityId:cube.id,path,action:'attach'});await run('scene.save');return {id:w.project.id,cubeId:cube.id,name:w.project.name,scriptPath:path};
}
export async function createPhysicsApiProjects(root,{folders=false,label='M18.3.8'}={}){
 const projects=[];
 for(const dimension of [2,3]){
  const w=new SceneWorkspace(new ProjectStore(root,{folders}));await w.run('project.create',{name:`Demo · ${label} Physics ${dimension}D API Lab`,dimension});
  const run=(type,data={})=>w.run(type,{id:w.project.id,expectedSceneRevision:w.revision,...data});
  const cube=w.project.scene.entities.find(e=>e.renderable||e.sprite2D);
  if(!cube)throw Error('New scene has no visible primitive');
  await run('scene.entity.update',{entityId:cube.id,name:`Physics ${dimension}D Probe · Space / R`,transform:{position:[0,2,0]}});
  await run('scene.collider.set',{entityId:cube.id,value:{dimension,shape:'box',halfExtents:[.5,.5,.5],trigger:false,layer:1,mask:4294967295}});
  await run('scene.rigidBody.set',{entityId:cube.id,value:{mass:1,velocity:[0,0,0],angularVelocity:[0,0,0],freezeRotation:false,restitution:.1,friction:.5,gravityScale:1}});
  await run('scene.primitive.create',{dimension,shape:dimension===2?'square':'cube'});const floor=w.project.scene.entities.at(-1);
  await run('scene.entity.update',{entityId:floor.id,name:'Static floor',transform:{position:[0,-1,0],scale:[8,.3,dimension===2?1:4]}});
  await run('scene.collider.set',{entityId:floor.id,value:{dimension,shape:'box',halfExtents:[4,.15,2],trigger:false,layer:1,mask:4294967295}});
  const path='Scripts/PhysicsApiLab.cs';await run('project.files.edit',{action:'create',kind:'script',path});await run('project.files.edit',{action:'write',path,text:await readFile(new URL('./scripts/PhysicsApiLab.cs',import.meta.url),'utf8')});await run('scene.script.edit',{entityId:cube.id,path,action:'attach'});await run('scene.save');projects.push({id:w.project.id,name:w.project.name,cubeId:cube.id,dimension});
 }
 return projects;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const root=(await new HubSettings().load()).projectRoot;console.log(JSON.stringify([await createRuntimeApiProject(root,{folders:true}),...await createPhysicsApiProjects(root,{folders:true})],null,2));}
