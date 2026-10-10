import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createM181Projects} from './create-m18-1-projects.mjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
export async function createM182Projects(root=resolve('.axiom/projects')){
 const [demo]=await createM181Projects(root,'Demo · M18.2 Editable Preview Workshop'),w=new SceneWorkspace(new ProjectStore(root));await w.run('project.open',{id:demo.id});const args=value=>({id:demo.id,expectedSceneRevision:w.revision,...value});
 await w.run('project.files.edit',args({action:'write',path:'Notes/Workshop.json',text:JSON.stringify({milestone:'M18.2',purpose:'Editable preview and efficient real-model authoring. No model runs automatically.',request:'Inspect Workshop Cube, move it to X=2, change its material to blue, create a floor and verify the authored result. Keep MAIN unchanged and summarize actual checks.',interaction:['Completion opens authored preview automatically, without Play.','Use Preview to compare MAIN and proposal. Save is blocked in preview.','Move Cube to X=5 manually in preview, then Apply: X=5 survives.','Alternative: leave preview, change MAIN X=5, return and Apply proposal X=2. Confirm full replacement; result X=2.','Play/Stop verifies transient runtime; Stop does not write runtime state.','Review changes shows scene, scripts and editor settings.','Send follow-up improvements into the pending proposal.','Discard removes proposal only. Restore pre-Apply MAIN recovers original draft.','Task steps and usage arrows browse retained tasks; Requests X/Y and individual input/cache/output/reasoning are reported.'],measurement:'Repeat the same prompt/model/settings as the old baseline. Compare actual provider-reported tokens and requests; fixture counts are not live token measurements.'},null,2)}));
 await w.run('scene.save',args());return [{...demo,name:demo.name.replace('M18.1 AI Assistant Workshop','M18.2 Editable Preview Workshop')}];
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await createM182Projects(),null,2));
