import {HubSettings} from '../daemon/bootstrap/hub-settings.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {newPmd} from '../engine/project/pmd.mjs';
import {fileURLToPath} from 'node:url';
export async function createM184Project(root,{mode='create'}={}){
 if(!['create','existing'].includes(mode))throw Error('Choose create or existing repository demo');
 const persistent=!root;if(persistent)root=(await new HubSettings().load()).projectRoot;
 const label=mode==='create'?'Create Repository':'Existing Repository';
 const w=new SceneWorkspace(new ProjectStore(root,{folders:persistent}));await w.run('project.create',{name:'Demo · M18.4 GitHub · '+label,dimension:3});
 const run=(type,data)=>w.run(type,{id:w.project.id,expectedSceneRevision:w.revision,...data});
 const cube=w.project.scene.entities.find(e=>e.renderable);await run('scene.entity.update',{entityId:cube.id,name:mode==='create'?'Create Repo Cube':'Existing Repo Cube',transform:{...cube.transform,position:mode==='create'?[-1,0,0]:[1,0,0]}});
 await run('project.files.edit',{action:'create',kind:'json',path:'Scripts/DemoMode.json',text:JSON.stringify({demo:'M18.4',mode,repositoryChosen:false},null,2)+'\n'});
 const pmd=newPmd();pmd.sections=[{id:'publication',title:'GitHub publication exercise',parentId:null,links:[],text:'Edit the cube or project sources, save MAIN, explicitly select a game test repository and review the changed files through the GitHub top-bar button. Publish and inspect the receipt. Never use the Axiom engine repository as the game target.'}];pmd.roadmap=[{id:'GAME-1',stage:'Demo',title:'Publish editable game baseline',deliverable:'Saved cube, camera, light and project sources in a selected game repository',validation:'Review the commit, reopen its UUID JSON and matching assets, and compare saved state',status:'planned'}];
 pmd.sections[0].title=label;pmd.sections[0].text+=' '+(mode==='create'?'Create a NEW private game repository from the GitHub panel, the project destination is linked automatically. Inspect its saved changes in the separate review dialog.':'Use the initialized game test repository created manually on GitHub. Do not press Create repository; select that existing destination. Verify its original README remains intact.');pmd.roadmap[0].id=mode==='create'?'GH-CREATE':'GH-EXISTING';
 await w.run('project.editor.update',{id:w.project.id,expectedSceneRevision:w.revision,value:{leftWidth:220,rightWidth:290,bottomHeight:190,pmd}});
 await w.run('scene.save',{id:w.project.id,expectedSceneRevision:w.revision});return {id:w.project.id,name:w.project.name,mode};
}
export async function createM184Projects(root){return [await createM184Project(root,{mode:'create'}),await createM184Project(root,{mode:'existing'})];}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await createM184Projects(process.argv[2]),null,2));
