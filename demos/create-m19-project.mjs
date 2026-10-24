import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {HubSettings} from '../daemon/bootstrap/hub-settings.mjs';
export async function createM19Project(root,{folders=false}={}){
 const w=new SceneWorkspace(new ProjectStore(root,{folders}));await w.run('project.create',{name:'Demo · M19 Compatibility Observatory',dimension:3});
 const run=(type,data={})=>w.run(type,{id:w.project.id,expectedSceneRevision:w.revision,...data}),cube=w.project.scene.entities.find(e=>e.renderable);
 await run('scene.entity.update',{entityId:cube.id,name:'Compatibility Probe'});
 await run('scene.collider.set',{entityId:cube.id,value:{dimension:3,shape:'box',halfExtents:[.5,.5,.5],trigger:false,layer:1,mask:4294967295}});
 if(!w.project.scene.projectFiles.some(f=>f.path==='Scripts'))await run('project.files.edit',{action:'create',kind:'folder',path:'Scripts'});
 const path='Scripts/CompatibilityProbe.cs';await run('project.files.edit',{action:'create',kind:'script',path});await run('project.files.edit',{action:'write',path,text:await readFile(new URL('./scripts/CompatibilityProbe.cs',import.meta.url),'utf8')});
 await run('scene.script.edit',{entityId:cube.id,path,action:'attach'});
 await run('project.files.edit',{action:'create',kind:'folder',path:'Assets/Resources'});
 await run('project.files.edit',{action:'create',kind:'json',path:'Assets/Resources/Observatory.json',text:'{"message":"M19 physical resource"}'});
 await run('scene.save');return {id:w.project.id,probeId:cube.id,path,name:w.project.name};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await createM19Project((await new HubSettings().load()).projectRoot,{folders:true})));
