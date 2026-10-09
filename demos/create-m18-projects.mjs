import {resolve} from 'node:path';import {fileURLToPath} from 'node:url';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {createM17Projects} from './create-m17-projects.mjs';
export async function createM18Projects(root=resolve('.axiom/projects')){
 const old=await createM17Projects(root,{milestone:'M18',includeCad:false}),w=new SceneWorkspace(new ProjectStore(root)),result=[old[0]];
 result[0].scriptStatus='Compiles automatically on opening; .NET 10 + wasm-tools required';
 const args=v=>({id:w.project.id,expectedSceneRevision:w.revision,...v});
 for(const kind of ['Position Repair','Compiler Repair']){
  await w.run('project.create',{name:'Demo · M18 Autonomy '+kind,dimension:3});const target=w.project.scene.entities.find(e=>e.renderable);let plan;
  if(kind==='Position Repair'){await w.run('scene.entity.update',args({entityId:target.id,name:'Target · expected X = 2'}));plan={objective:'Place the target at X = 2 and verify it in a fresh runtime',suite:{name:'Target placement',steps:[{frames:0,assertions:[{kind:'position',entityId:target.id,value:[2,0,0],tolerance:.001}]}]},actions:[],repairPolicy:'position',maxIterations:3,maxSeconds:300};}
  else{const path='Scripts/RepairMover.cs',broken='Entity.Move(new Vector3(1,0,0) * deltaSeconds)';await w.run('project.files.edit',args({action:'create',kind:'script',path}));await w.run('project.files.edit',args({action:'write',path,text:'using Axiom.Gameplay; namespace Game; public sealed class RepairMover : MonoBehaviour { public override void OnUpdate(double deltaSeconds) { '+broken+' } }'}));await w.run('scene.script.edit',args({entityId:target.id,path,action:'attach'}));plan={objective:'Repair the controller compilation and prove movement after 30 frames',suite:{name:'Controller movement',steps:[{frames:30,assertions:[{kind:'position',entityId:target.id,value:[.5,0,0],tolerance:.001}]}]},actions:[],repairPolicy:'none',compilerRepairs:[{path,find:broken,replace:broken+';'}],maxIterations:3,maxSeconds:600};}
  await w.run('project.editor.update',args({value:{leftWidth:220,rightWidth:330,bottomHeight:220,autoCompile:false,autonomyPlans:[plan]}}));await w.run('scene.save',args());result.push({id:w.project.id,name:w.project.name,targetId:target.id});await w.run('project.close',args());
 }
 return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await createM18Projects(),null,2));
