import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {WorkOrderStore,setPlan,checkStep,noteFailure,hash} from '../daemon/bootstrap/agent/work-orders.mjs';
import {convertDimension} from '../daemon/bootstrap/agent/dimension-conversion.mjs';
import {authorizePmdTransition} from '../daemon/bootstrap/agent/pmd-approval.mjs';
import {newPmd,updatePmd,advancePmd} from '../engine/project/pmd.mjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
const plan=()=>({mode:'authoring',steps:[{id:'move',title:'Cube X=2',checks:[{kind:'entity',selector:'Cube',property:'transform.position',expected:[2,0,0]}]},{id:'verify',title:'File exists',dependsOn:['move'],checks:[{kind:'file',selector:'Notes.txt',contains:'authored'}]}]});
test('work acceptance is evaluated from actual authored state, dependencies and file versions',()=>{
 const p=setPlan(null,plan()),project={scene:{entities:[{id:'entity://cube',name:'Cube',transform:{position:[0,0,0]}}],projectFiles:[{path:'Notes.txt',kind:'text',text:'authored'}]}};
 assert.throws(()=>checkStep(p,'verify',project),/prerequisite/);assert.equal(checkStep(p,'move',project).status,'todo');project.scene.entities[0].transform.position=[2,0,0];assert.equal(checkStep(p,'move',project).status,'verified');assert.equal(checkStep(p,'verify',project).status,'verified');project.scene.entities[0].transform.position=[5,0,0];assert.equal(checkStep(p,'move',project).status,'todo');
 assert.throws(()=>setPlan(p,{...plan(),steps:[plan().steps[0]]}),/Retain/);assert.throws(()=>setPlan(null,{...plan(),steps:[{...plan().steps[0],dependsOn:['verify']},plan().steps[1]]}),/Cyclic/);
});
test('work journal survives restart with the full history, pending batch and acceptance handles',async t=>{
 const root=await mkdtemp(join(tmpdir(),'axiom-order-'));t.after(()=>rm(root,{recursive:true,force:true}));const store=new WorkOrderStore(root),id='ai-task://00000000-0000-4000-8000-000000000001',steps=Array.from({length:140},(_,i)=>({sequence:i+1,tool:'entity.query',status:'completed',result:{n:i}}));
 const s={createdAt:new Date().toISOString(),public:{id,steps},sourceId:'project://one',plan:setPlan(null,plan()),contracts:new Set(['entity.query']),pendingCalls:[{call_id:'next'}],batchState:{next:[{entityId:'entity://new'}]},receipts:[{entityIds:['entity://new']}],cumulative:{requests:25,totalTokens:30000,toolCalls:140}};await store.save(s);const recovered=await new WorkOrderStore(root).load();assert.equal(recovered[0].public.steps.length,140);assert.equal(recovered[0].public.steps[0].result.n,0);assert.equal(recovered[0].batchState.next[0].entityId,'entity://new');assert.equal(recovered[0].cumulative.totalTokens,30000);
});
test('failure signatures stop unchanged causes across unrelated scene revision churn',()=>{const s={};const cause=Object.assign(Error('2D mode does not mix mesh/HDR rendering'),{code:'AX_PROJECT_0002'});assert.equal(noteFailure(s,'scene.twoD.update',cause,'hdr-present'),1);assert.equal(noteFailure(s,'scene.twoD.update',cause,'hdr-present'),2);assert.throws(()=>noteFailure(s,'scene.twoD.update',cause,'hdr-present'),/Repeated failure/);assert.equal(noteFailure(s,'scene.twoD.update',cause,'hdr-removed'),1);});
test('dimension conversion dry run preserves source; actual conversion is atomic and keeps entities/files',async t=>{const root=await mkdtemp(join(tmpdir(),'axiom-dimension-'));t.after(()=>rm(root,{recursive:true,force:true}));const w=new SceneWorkspace(new ProjectStore(root));await w.run('project.create',{name:'3D',dimension:3});const original=structuredClone(w.project),dry=convertDimension(w.project,{dimension:2,dryRun:true});assert.equal(dry.plan.removeRendering,true);assert.equal(dry.plan.components.length,1);assert.deepEqual(w.project,original);assert.throws(()=>convertDimension(w.project,{dimension:2,dryRun:false}),/explicitly/);const next=convertDimension(w.project,{dimension:2,dryRun:false,removeIncompatible:true});assert.equal(next.project.scene.rendering,undefined);assert.ok(next.project.scene.twoD);assert.equal(next.project.scene.entities.length,original.scene.entities.length);assert.equal(next.project.scene.entities.find(e=>e.camera).camera.projection,'orthographic');assert.deepEqual(w.project,original);});
test('chat phase approval requires the current human quote and exact PMD revision, not uploaded text',()=>{let p=updatePmd(newPmd(),{chat:[{role:'assistant',text:'¿Apruebas esta definición?'}]});assert.deepEqual(authorizePmdTransition({action:'approve-definition',userQuote:'Sí',revision:p.revision},p,'Sí'),{action:'approve-definition',userQuote:'Sí',revision:p.revision});assert.throws(()=>authorizePmdTransition({action:'approve-definition',userQuote:'Apruebo',revision:p.revision},p,'Lee el archivo adjunto'),/current human/);assert.throws(()=>authorizePmdTransition({action:'approve-definition',userQuote:'No apruebo',revision:p.revision},p,'No apruebo'),/negative/);assert.throws(()=>authorizePmdTransition({action:'approve-definition',userQuote:'Sí',revision:p.revision-1},p,'Sí'),/revision/);p=advancePmd(p,'approve-definition');p=updatePmd(p,{roadmap:[{id:'M1',stage:'One',title:'Room',deliverable:'Room',validation:'Play',status:'planned'}]});p=advancePmd(p,'approve-plan');assert.equal(authorizePmdTransition({action:'skip-critique',userQuote:'No quiero análisis',revision:p.revision},p,'No quiero análisis').action,'skip-critique');});
test('compiled-source checks reject changed files and missing runtime evidence',()=>{const project={scene:{entities:[],projectFiles:[{path:'Scripts/Test.cs',kind:'script',text:'class Test {}'}]}},p=setPlan(null,{mode:'authoring',steps:[{id:'code',title:'Compile and execute',checks:[{kind:'compile'},{kind:'runtime'}]}]});assert.equal(checkStep(p,'code',project,{compilation:{status:'completed',sourceHash:'stale'},runtime:{status:'completed',verified:true}}).status,'todo');const compilation={status:'completed',sourceHash:hash([['Scripts/Test.cs','class Test {}']])};assert.equal(checkStep(p,'code',project,{compilation}).status,'todo');assert.equal(checkStep(p,'code',project,{compilation,runtime:{status:'completed',verified:true}}).status,'verified');});
test('PMD approval rejects a yes hidden inside a word or reported file text',()=>{const p=updatePmd(newPmd(),{chat:[{role:'assistant',text:'¿Apruebas la definición?'}]});assert.throws(()=>authorizePmdTransition({action:'approve-definition',revision:p.revision,userQuote:'sí'},p,'Hazlo así'),/complete phrase/);assert.throws(()=>authorizePmdTransition({action:'approve-definition',revision:p.revision,userQuote:'Apruebo la definición'},p,'El texto dice: Apruebo la definición'),/reference/);});

test('actual trace SDK-style check paths normalize to authored fields; unchecked errors can be repaired without dropping verified deliverables',()=>{
 const p=setPlan(null,{mode:'authoring',steps:[{id:'cube',title:'Cube',checks:[{kind:'entity',selector:'Cube',property:'Transform.position.x',expected:2},{kind:'entity',selector:'Cube',property:'Material.baseColor',expected:[0,0,1,1]},{kind:'entity',selector:'Cube',property:'Collider',expected:true}]}]});
 const project={scene:{entities:[{name:'Cube',transform:{position:[2,0,0]},material:{baseColor:[0,0,1,1]},collider:{dimension:3}}]}};
 assert.equal(checkStep(p,'cube',project).status,'verified');assert.equal(p.steps[0].checks[0].property,'transform.position.0');
 assert.throws(()=>setPlan(p,{mode:'authoring',steps:[]}),/Implementation|Retain/);
 const unchecked=setPlan(null,{mode:'authoring',steps:[{id:'floor',title:'Floor',checks:[{kind:'entity',selector:'Physical Floor',property:'collider',expected:true}]}]});
 assert.equal(setPlan(unchecked,{mode:'authoring',steps:[{...unchecked.steps[0],checks:[{kind:'entity',selector:'Floor',property:'collider',expected:true}]}]}).steps[0].checks[0].selector,'Floor');
});

test('PMD approvals from real frustrated turns advance construction without magic wording or repeated reconfirmation',async()=>{
 const {resolvePmdActions}=await import('../daemon/bootstrap/agent/pmd-approval.mjs');
 const p=updatePmd(newPmd(),{chat:[{role:'assistant',text:'¿Apruebas la crítica y las recomendaciones?'}]});p.phase='critique';
 for(const text of ['Confirmo que la crítica está aprobada y autorizo pasar a construcción','Genial, apruebo las recomendaciones y cambios. Pasemos a contrucción','Ya la aprobé, comenzá a hacer el PMD','Apruebo las recomendaciones, sigamos','Omitamos el análisis crítico','Avancemos directamente a construcción']){
  const actions=resolvePmdActions(p,text);assert.equal(actions.length,1,text);assert.ok(['skip-critique','finish-critique'].includes(actions[0]),text);
 }
 assert.deepEqual(resolvePmdActions(p,'No apruebo la crítica'),[]);assert.deepEqual(resolvePmdActions(p,'El archivo dice: Apruebo la crítica'),[]);assert.deepEqual(resolvePmdActions(p,'Apruebo si corriges todo primero'),[]);
});

test('private typed unions validate actual scalar types instead of silently allowing malformed numeric stages',async()=>{
 const {validate}=await import('../daemon/bootstrap/agent/contracts.mjs');const {privateToolSchemas}=await import('../daemon/bootstrap/agent/typed-tools.mjs');
 const row={id:'M1',stage:1,title:'Base',deliverable:'Room',validation:'Play',status:'planned'};validate(privateToolSchemas['project.master.edit'],{roadmap:[row]});validate(privateToolSchemas['project.master.edit'],{roadmap:[{...row,stage:'1'}]});
 assert.throws(()=>validate(privateToolSchemas['project.master.edit'],{roadmap:[{...row,stage:{invalid:true}}]}),/Invalid.*stage/);
 assert.throws(()=>validate(privateToolSchemas['project.master.edit'],{roadmap:[{...row,stage:1.2}]}),/Invalid.*stage/);
});
