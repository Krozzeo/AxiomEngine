import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {newPmd,updatePmd} from '../engine/project/pmd.mjs';
import {component2DDefaults} from '../engine/renderer/two-d-plan.mjs';
import {playerExamples} from '../daemon/bootstrap/player-prefabs.mjs';
export async function createM183Projects(root=resolve('.axiom/projects')){
 const demos=[];const w=new SceneWorkspace(new ProjectStore(root)),run=(type,data={})=>w.run(type,{id:w.project.id,expectedSceneRevision:w.revision,...data});
 await w.run('project.create',{name:'Demo · M18.3 PMD Planning Workshop',dimension:3});
 const pmd=updatePmd(newPmd(),{sections:[{id:'brief',title:'Imported brief · intentionally ambiguous',parentId:null,links:['questions'],text:'A small puzzle game about arranging falling colored blocks. It should be fun, playable on a computer, and save progress. Scope, target audience, art budget, input and success criteria need definition.'},{id:'questions',title:'Questions to resolve',parentId:'brief',links:[],text:'How many levels? Which desktop targets? Keyboard or mouse? What does saving progress include? Solo development? Art/audio constraints?'}],decisions:[{text:'A small puzzle game',status:'proposed'},{text:'Desktop target (exact platforms unresolved)',status:'assumption'}],questions:['Which mechanics define winning and losing?','Which platforms and production constraints apply?']});
 await run('project.editor.update',{value:{leftWidth:220,rightWidth:290,bottomHeight:190,pmd}});demos.push({id:w.project.id,name:w.project.name});
 for(const name of Object.keys(playerExamples)){
  const dimension=name.startsWith('3D')?3:2;await w.run('project.create',{name:'Demo · M18.3 '+name,dimension});
  const starter=w.project.scene.entities.find(e=>e.renderable);if(starter)await run('scene.entity.delete',{entityId:starter.id});
  // Compile all four physical controller sources together; only the selected Player is attached.
  await run('project.files.edit',{action:'create',kind:'folder',path:'Scripts/Players'});
  for(const type of Object.values(playerExamples)){const path='Scripts/Players/'+type+'.cs';await run('project.files.edit',{action:'create',kind:'script',path});await run('project.files.edit',{action:'write',path,text:await readFile(new URL('../engine/scripting/players/'+type+'.cs',import.meta.url),'utf8')});}
  const cube=async(label,position,scale,collider=true)=>{await run('scene.primitive.create',{dimension,shape:dimension===3?'cube':'square'});const e=w.project.scene.entities.at(-1);await run('scene.entity.update',{entityId:e.id,name:label,transform:{position,scale}});if(dimension===2)await run('scene.sprite2D.set',{entityId:e.id,value:{...structuredClone(component2DDefaults.sprite2D),tint:[.2,.35,.5,1],order:label==='Ground'?-10:0}});if(collider)await run('scene.collider.set',{entityId:e.id,value:{dimension,shape:'box',halfExtents:scale.map(v=>Math.abs(v)/2),trigger:false,layer:1,mask:4294967295}});};
  if(name==='2D RPG Player'){await cube('Ground',[0,0,-.1],[12,8,1],false);for(const [p,s]of [[[0,3.5,0],[12,.5,1]],[[0,-3.5,0],[12,.5,1]],[[5.5,0,0],[.5,7,1]],[[-5.5,0,0],[.5,7,1]]])await cube('Boundary',p,s);}
  else{await cube('Ground',[0,-.5,0],dimension===3?[20,1,20]:[20,1,1]);await cube('Step',[3,.25,dimension===3?-3:0],[2,.5,dimension===3?2:1]);await cube('Upper step',[5,.75,dimension===3?-3:0],[2,.5,dimension===3?2:1]);}
  await run('scene.example.create',{example:name});const player=w.project.scene.entities.find(e=>e.name===name);await run('scene.save');demos.push({id:w.project.id,name:w.project.name,playerId:player.id,scriptPath:player.scriptComponents[0].path});
 }
 return demos;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await createM183Projects(),null,2));
