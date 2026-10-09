import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
export async function createM181Projects(root=resolve('.axiom/projects')){
 const w=new SceneWorkspace(new ProjectStore(root)),result=[];
 const args=value=>({id:w.project.id,expectedSceneRevision:w.revision,...value});
 await w.run('project.create',{name:'Demo · M18.1 AI Assistant Workshop',dimension:3});
 const cube=w.project.scene.entities.find(e=>e.renderable);await w.run('scene.entity.update',args({entityId:cube.id,name:'Workshop Cube'}));
 await w.run('project.files.edit',args({action:'create',kind:'folder',path:'Notes'}));
 await w.run('project.files.edit',args({action:'create',kind:'json',path:'Notes/Workshop.json'}));
 await w.run('project.files.edit',args({action:'write',path:'Notes/Workshop.json',text:JSON.stringify({purpose:'Real configured-model multistep workshop; no model or predetermined repair runs automatically.',request:'Inspect Workshop Cube, move it to X=2, change its material to blue, create a floor and verify the authored result. Keep MAIN unchanged and summarize actual checks.',followUp:'In the same pending proposal, move Workshop Cube to X=5 and verify its position.'},null,2)}));
 await w.run('project.editor.update',args({value:{leftWidth:220,rightWidth:330,bottomHeight:220,autoCompile:false,assistantInstructions:'Work through several small semantic-tool steps. Use queries to verify actual changes. Keep all edits in a proposal and leave acceptance and saving to the human.'}}));
 await w.run('scene.save',args());result.push({id:w.project.id,name:w.project.name,cubeId:cube.id});await w.run('project.close',args());return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await createM181Projects(),null,2));
