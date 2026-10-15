import {hash,workError,entitySelector} from './work-orders.mjs';
import {projectFiles} from '../../../engine/scene/project-files.mjs';

// Revisions, jobs, chat and build IDs are bookkeeping, not authored progress.
export function progressFingerprint(project,s){
 const scene=project.scene,pmd=project.editor?.pmd;
 const checks=s.plan?.steps.flatMap(step=>step.checks)??[],selectors=new Set(checks.filter(c=>['entity','script-assigned'].includes(c.kind)).map(c=>entitySelector(c.selector))),fileSelectors=new Set(checks.filter(c=>c.kind==='file').map(c=>c.selector)),coding=checks.some(c=>['compile','runtime','script-assigned'].includes(c.kind));
 const entities=selectors.size?scene.entities.filter(e=>selectors.has(e.id)||selectors.has(e.name)):scene.entities;
 const files=projectFiles(scene).filter(f=>f.kind!=='folder'&&(!checks.length||fileSelectors.has(f.path)||coding&&f.kind==='script'));
 const authored=s.plan?{entities,files:files.map(f=>[f.path,f.text??f.assetId])}:{...scene,projectFiles:undefined,script:scene.script?{source:scene.script.source,entryPath:scene.script.entryPath}:null};
 return hash({scene:authored,pmd:pmd?{phase:pmd.phase,approvals:pmd.approvals,sections:pmd.construction?pmd.sections.filter(v=>pmd.construction.requiredIds.includes(v.id)):pmd.sections,decisions:pmd.decisions,questions:pmd.questions,roadmap:pmd.roadmap}:null,compilation:s.lastCompilation?{sourceHash:s.lastCompilation.sourceHash,status:s.lastCompilation.status}:null,runtime:s.runtimeEvidence?{sceneHash:s.runtimeEvidence.sceneHash,verified:s.runtimeEvidence.verified}:null,checks:s.plan?.steps.map(step=>({id:step.id,checks:step.checks,status:step.status}))});
}
export function observeProgress(s,project,name,result){
 const fingerprint=progressFingerprint(project,s),old=s.progress;
 const observations=old?.observations??[],facts=name==='entity.query'&&result?.items?.length?result.items:['project.file.read','project.master.read'].includes(name)&&result?.file?.text?{path:result.file.path,text:result.file.text}:null,key=facts?hash(facts):null;
 const learned=key&&!observations.includes(key);
 const changed=old?.fingerprint!==fingerprint||learned;
 s.progress={fingerprint,observations:learned?[...observations,key].slice(-128):observations,stalled:changed?0:(old?.stalled??0)+1,stage:changed?'executing':(old?.stalled??0)>=7?'repairing':'checking',lastTool:name};
 s.public.progress={...s.progress,fingerprint:undefined,observations:undefined};
 if(s.progress.stalled>=16)throw workError('No authored/evidence progress after 16 operations, including private checks. Correct the specific pending predicate or blocked precondition; checkpoint retained.','AX_AI_NO_PROGRESS');
 return s.progress.stalled>=8?{stage:'repairing',unchangedOperations:s.progress.stalled,nextAction:'Repair the pending acceptance predicate/contract once; do not repeat reads, checks or unchanged compilation.'}:null;
}
