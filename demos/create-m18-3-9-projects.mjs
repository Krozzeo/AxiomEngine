import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {HubSettings} from '../daemon/bootstrap/hub-settings.mjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {capturePrefab} from '../engine/scene/prefabs.mjs';
import {createRuntimeApiProject,createPhysicsApiProjects} from './create-m18-3-8-projects.mjs';
export async function createInputSceneProjects(root,{folders=false,label='M18.3.9'}={}){
 const results=[];for(const [title,script]of [['Input & Persistence API Lab','InputApiLab'],['Scenes & Resources API Lab','SceneResourcesLab']]){
  const w=new SceneWorkspace(new ProjectStore(root,{folders}));await w.run('project.create',{name:'Demo · '+label+' '+title,dimension:3});const run=(type,data={})=>w.run(type,{id:w.project.id,expectedSceneRevision:w.revision,...data}),cube=w.project.scene.entities.find(e=>e.renderable);
  await run('scene.entity.update',{entityId:cube.id,name:script==='InputApiLab'?'Input Probe · WASD / J / P':'Persistent Probe · A / U / N / I / P',transform:{position:[0,1,0]}});
  if(script==='SceneResourcesLab'){
   const prefab=capturePrefab(w.project.scene,[cube.id]);prefab.entities[0].name='Resource Crate';prefab.entities[0].transform.position=[-2,1,0];await run('project.files.edit',{action:'create',kind:'json',path:'Assets/Crate.prefab.json'});await run('project.files.edit',{action:'write',path:'Assets/Crate.prefab.json',text:JSON.stringify(prefab)});
   const entities=structuredClone(w.project.scene.entities);if(label!=='M18.3.9'){const map=new Map(entities.map(e=>[e.id,'entity://'+crypto.randomUUID()]));for(const e of entities){const id=e.id;e.id=map.get(id);if(e.parentId)e.parentId=map.get(e.parentId);}}const arena=entities.find(e=>e.renderable);arena.name='Arena Cube';arena.transform.position=[3,1,0];await run('project.files.edit',{action:'create',kind:label==='M18.3.9'?'json':'scene',path:label==='M18.3.9'?'Scenes/Arena.scene.json':'Scenes/Arena.scene'});await run('project.files.edit',{action:'write',path:label==='M18.3.9'?'Scenes/Arena.scene.json':'Scenes/Arena.scene',text:JSON.stringify({format:'axiom-scene',version:1,entities})});await run('project.files.edit',{action:'create',kind:'json',path:'Assets/Settings.json'});await run('project.files.edit',{action:'write',path:'Assets/Settings.json',text:'{"difficulty":"normal","version":1}'});
  }
  const path='Scripts/'+script+'.cs';await run('project.files.edit',{action:'create',kind:'script',path});await run('project.files.edit',{action:'write',path,text:await readFile(new URL('./scripts/'+script+'.cs',import.meta.url),'utf8')});await run('scene.script.edit',{entityId:cube.id,path,action:'attach'});await run('scene.save');results.push({id:w.project.id,name:w.project.name,cubeId:cube.id,scriptPath:path});
 }return results;
}
export async function createApiProjects(root,options={}){return [await createRuntimeApiProject(root,{...options,label:'M18.3.9'}),...await createInputSceneProjects(root,options),...await createPhysicsApiProjects(root,{...options,label:'M18.3.9'})];}
if(process.argv[1]===fileURLToPath(import.meta.url)){const root=(await new HubSettings().load()).projectRoot;console.log(JSON.stringify(await createApiProjects(root,{folders:true}),null,2));}
