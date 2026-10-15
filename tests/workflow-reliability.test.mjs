import test from 'node:test';
import assert from 'node:assert/strict';
import {setPlan,checkStep,hash} from '../daemon/bootstrap/agent/work-orders.mjs';
import {observeProgress} from '../daemon/bootstrap/agent/progress.mjs';
import {newPmd,updatePmd,advancePmd} from '../engine/project/pmd.mjs';
import {beginConstruction,constructionStatus,finishConstruction} from '../daemon/bootstrap/agent/pmd-construction.mjs';
const project=()=>({scene:{entities:[{id:'entity://cube',name:'Cube',transform:{position:[0,0,0]},scriptComponents:[{path:'Scripts/Motion.cs'}]}],projectFiles:[{path:'Scripts',kind:'folder'},{path:'Scripts/Motion.cs',kind:'script',text:'public double Speed; public double MinY; public double MaxY;'}]}});
const plan=checks=>({mode:'authoring',steps:[{id:'code',title:'Actual script',checks}]});
test('supplied M2 trace: reject directory checks and invalid hashes before executing work; normalize script component alias',()=>{
 assert.throws(()=>setPlan(null,plan([{kind:'file',selector:'Scripts',contains:'speed'}]),project()),/not a directory/);
 assert.throws(()=>setPlan(null,plan([{kind:'file-hash',selector:'Scripts/Motion.cs',expected:true}]),project()),/SHA-256/);
 const p=setPlan(null,plan([{kind:'entity',selector:'Cube',property:'script',expected:true}]),project());assert.equal(p.steps[0].checks[0].property,'scriptComponents');assert.equal(checkStep(p,'code',project()).status,'verified');
});
test('file predicates report content and existence independently; physical script assignment is checked',()=>{
 const p=setPlan(null,plan([{kind:'file-exists',selector:'Scripts/Motion.cs'},{kind:'file-contains',selector:'Scripts/Motion.cs',contains:'Speed'},{kind:'file-hash',selector:'Scripts/Motion.cs',expected:hash(project().scene.projectFiles[1].text)},{kind:'script-assigned',selector:'Cube',expected:'Scripts/Motion.cs'}]),project());assert.equal(checkStep(p,'code',project()).status,'verified');
 p.steps[0].checks[1].contains='speed';const result=checkStep(p,'code',project());assert.equal(result.status,'todo');assert.equal(result.results[1].predicates.contentMatches,false);assert.equal(result.results[1].predicates.exists,true);assert.match(result.results[1].reason,/Case-sensitive/);assert.equal(result.results[3].passed,true);
});
test('private check and alternating empty queries cannot bypass semantic stagnation through revision churn',()=>{
 const p=project(),s={public:{},plan:setPlan(null,plan([{kind:'file',selector:'Scripts/Motion.cs',contains:'Missing'}]))};
 observeProgress(s,p,'work.plan');for(let i=0;i<15;i++){p.revision=i;observeProgress(s,p,i%2?'entity.query':'work.check',{items:[],sceneRevision:i});}assert.throws(()=>observeProgress(s,p,'work.status'),/16 operations/);assert.equal(s.public.progress.stage,'repairing');
});
test('new real facts and passing predicates make progress; repeated facts and unchanged compilation do not',()=>{
 const p=project(),s={public:{},plan:setPlan(null,plan([{kind:'file',selector:'Scripts/Motion.cs',contains:'Speed'}]))};
 observeProgress(s,p,'entity.query',{items:[p.scene.entities[0]]});observeProgress(s,p,'entity.query',{items:[p.scene.entities[0]]});assert.equal(s.progress.stalled,1);
 checkStep(s.plan,'code',p);observeProgress(s,p,'work.check');assert.equal(s.progress.stalled,0);s.lastCompilation={status:'completed',sourceHash:'one'};observeProgress(s,p,'script.compile');s.lastCompilation.revision=55;observeProgress(s,p,'script.compile');assert.equal(s.progress.stalled,1);
});
function approved(){let p=updatePmd(newPmd(),{decisions:[{text:'Small puzzle with reset',status:'proposed'}],roadmap:[{id:'M1',stage:'Base',title:'Puzzle',deliverable:'Playable puzzle',validation:'Win and reset',status:'planned'}]});p=advancePmd(p,'approve-definition');p=advancePmd(p,'approve-plan');return advancePmd(p,'skip-critique');}
test('PMD host queue exposes progressive committed sections and finishes without a fresh lexical approval',()=>{
 let p=beginConstruction(approved());assert.deepEqual(constructionStatus(p).pending,['overview','requirements','technical']);const original=p;
 for(const id of ['overview','requirements','technical']){p=updatePmd(p,{sections:p.sections.map(s=>s.id===id?{...s,text:'Concrete section content grounded in the approved small puzzle scope.'}:s)});assert.ok(constructionStatus(p).completed>constructionStatus(original).completed);}
 p=finishConstruction(p);assert.equal(p.phase,'ready');assert.deepEqual(p.sections.find(s=>s.id==='overview').links,['requirements','technical','roadmap']);assert.equal(original.phase,'construction');assert.equal(original.sections.find(s=>s.id==='technical').text,'');
});
test('PMD incomplete sections, missing roadmap criteria and approved scope changes prevent automatic completion',()=>{
 let p=beginConstruction(approved());assert.equal(finishConstruction(p).phase,'construction');p=updatePmd(p,{sections:p.sections.map(s=>({...s,text:'Long enough section that fails to mention the roadmap acceptance.'}))});assert.equal(constructionStatus(p).ready,false);assert.deepEqual(constructionStatus(p).uncoveredMilestones,['M1']);
 const changed=updatePmd(p,{roadmap:p.roadmap.map(m=>({...m,deliverable:'A different game'}))});assert.equal(changed.phase,'planning');assert.equal(changed.approvals.planning,false);assert.equal(changed.construction,undefined);
});
test('PMD roadmap descendants cover approved criteria without rewriting overview',()=>{
 let p=beginConstruction(approved());p=updatePmd(p,{sections:[...p.sections.map(s=>s.id==='roadmap'?{...s,text:'See the approved milestone sections below.'}:{...s,text:'Concrete section grounded in the approved puzzle scope.'}),{id:'milestone-1',title:'M1 · Puzzle',parentId:'roadmap',links:[],text:'Deliverable: Playable\n puzzle\nValidation: Win and reset'}]});
 assert.equal(constructionStatus(p).ready,true);assert.equal(finishConstruction(p).phase,'ready');
 p=updatePmd(p,{sections:p.sections.map(s=>s.id==='milestone-1'?{...s,text:'Missing the approved acceptance criteria'}:s)});assert.deepEqual(constructionStatus(p).uncoveredMilestones,['M1']);assert.match(constructionStatus(p).nextAction,/Document these approved milestones/);
});
test('approved milestone references survive a model summary so construction does not require lexical rewrites',()=>{
 let p=beginConstruction(approved());const references=p.sections.filter(s=>s.id.startsWith('approved-'));assert.equal(references.length,1);assert.match(references[0].text,/Playable puzzle/);assert.match(references[0].text,/Win and reset/);
 p=updatePmd(p,{sections:p.sections.map(s=>['overview','requirements','technical','roadmap'].includes(s.id)?{...s,text:'A concise authored description of the agreed puzzle and its implementation.'}:s)});assert.equal(constructionStatus(p).ready,true);assert.equal(finishConstruction(p).phase,'ready');
});
