import {HubSettings} from '../daemon/bootstrap/hub-settings.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {newPmd} from '../engine/project/pmd.mjs';
import {fileURLToPath} from 'node:url';
export async function createM184Project(root){
 const persistent=!root;if(persistent)root=(await new HubSettings().load()).projectRoot;
 const w=new SceneWorkspace(new ProjectStore(root,{folders:persistent}));await w.run('project.create',{name:'Demo · M18.4 GitHub Publication Lab',dimension:3});
 const pmd=newPmd();pmd.sections=[{id:'publication',title:'GitHub publication exercise',parentId:null,links:[],text:'Edit the cube or project sources, save MAIN, explicitly select a game test repository and review the changed files through the GitHub top-bar button. Publish and inspect the receipt. Never use the Axiom engine repository as the game target.'}];pmd.roadmap=[{id:'GAME-1',stage:'Demo',title:'Publish editable game baseline',deliverable:'Saved cube, camera, light and project sources in a selected game repository',validation:'Review the commit, reopen its UUID JSON and matching assets, and compare saved state',status:'planned'}];
 await w.run('project.editor.update',{id:w.project.id,expectedSceneRevision:w.revision,value:{leftWidth:220,rightWidth:290,bottomHeight:190,pmd}});
 await w.run('scene.save',{id:w.project.id,expectedSceneRevision:w.revision});return {id:w.project.id,name:w.project.name};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await createM184Project(process.argv[2])));
