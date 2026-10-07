import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
export async function createM161Projects(root=resolve('.axiom/projects')){
 const w=new SceneWorkspace(new ProjectStore(root)),result=[];
 const args=value=>({id:w.project.id,expectedSceneRevision:w.revision,...value});
 for(const dimension of [3,2]){
  await w.run('project.create',{name:'Demo · M16.1 '+dimension+'D Editor & Ambient Lab',dimension});
  for(const path of ['Scripts/Gameplay','Scripts/Examples','Assets/EmptyFolder'])await w.run('project.files.edit',args({action:'create',kind:'folder',path}));
  await w.run('project.files.edit',args({action:'create',kind:'script',path:'Scripts/Gameplay/AmbientLabController'+dimension+'D.cs'}));
  if(dimension===3){for(const shape of ['sphere','capsule'])await w.run('scene.primitive.create',args({dimension,shape}));const items=w.project.scene.entities.filter(e=>e.renderable);for(const[i,e]of items.entries())await w.run('scene.entity.update',args({entityId:e.id,transform:{position:[(i-1)*2.5,0,0]}}));}
  await w.run('scene.save',args());result.push({id:w.project.id,name:w.project.name});await w.run('project.close',args());
 }
 return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){console.log(JSON.stringify(await createM161Projects(),null,2));console.log('Open a demo in Saved projects. See demos/M16_1_GUIDE.md.');}
