import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {HubSettings} from '../daemon/bootstrap/hub-settings.mjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
export async function createRuntimeApiProject(root,{folders=false}={}){
 const w=new SceneWorkspace(new ProjectStore(root,{folders}));await w.run('project.create',{name:'Demo · M18.3.8 Runtime API Lab',dimension:3});
 const run=(type,data={})=>w.run(type,{id:w.project.id,expectedSceneRevision:w.revision,...data}),cube=w.project.scene.entities.find(e=>e.renderable);
 await run('scene.entity.update',{entityId:cube.id,name:'Runtime API Probe',transform:{position:[0,1,0]}});
 const path='Scripts/RuntimeApiLab.cs';await run('project.files.edit',{action:'create',kind:'script',path});await run('project.files.edit',{action:'write',path,text:await readFile(new URL('./scripts/RuntimeApiLab.cs',import.meta.url),'utf8')});await run('scene.script.edit',{entityId:cube.id,path,action:'attach'});await run('scene.save');return {id:w.project.id,cubeId:cube.id,name:w.project.name,scriptPath:path};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const root=(await new HubSettings().load()).projectRoot;console.log(JSON.stringify([await createRuntimeApiProject(root,{folders:true})],null,2));}
