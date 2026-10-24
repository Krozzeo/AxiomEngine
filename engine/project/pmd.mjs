import {sectionIndex} from './document-sections.mjs';
const clone=value=>structuredClone(value);
export const pmdPhases=['definition','planning','critique','construction','ready'];
const fail=message=>{throw Error('PMD: '+message);};
const size=value=>new TextEncoder().encode(JSON.stringify(value)).length;
export function newPmd(){return {format:'axiom-pmd',version:1,revision:1,phase:'definition',approvals:{definition:false,planning:false,critique:false},sections:[],decisions:[],questions:[],roadmap:[],chat:[{role:'assistant',text:'What project do you have in mind?'}],history:[]};}
export function validatePmd(p){
 if(!p||p.format!=='axiom-pmd'||p.version!==1||!Number.isSafeInteger(p.revision)||p.revision<1||!pmdPhases.includes(p.phase))fail('invalid format or phase');
 if(!p.approvals||['definition','planning','critique'].some(k=>typeof p.approvals[k]!=='boolean'))fail('invalid approvals');
 if(!Array.isArray(p.sections)||p.sections.length>64)fail('maximum 64 sections');
 const ids=new Set();for(const s of p.sections){if(!s||typeof s.id!=='string'||!/^[a-z][a-z0-9_-]{0,63}$/.test(s.id)||ids.has(s.id)||typeof s.title!=='string'||!s.title.trim()||s.title.length>160||typeof s.text!=='string'||s.text.length>12000||!Array.isArray(s.links)||s.links.length>64)fail('invalid or duplicate section');ids.add(s.id);}
 for(const s of p.sections){if(s.parentId!==null&&!ids.has(s.parentId)||s.links.some(id=>!ids.has(id)))fail('missing section link or parent');const visited=new Set([s.id]);let parent=s.parentId;while(parent!==null){if(visited.has(parent))fail('section cycle');visited.add(parent);parent=p.sections.find(v=>v.id===parent).parentId;}}
 if(p.construction&&(!/^[a-f0-9]{64}$/.test(p.construction.scopeHash)||!Array.isArray(p.construction.requiredIds)||p.construction.requiredIds.length!==4||p.construction.requiredIds.some(id=>!['overview','requirements','technical','roadmap'].includes(id))||new Set(p.construction.requiredIds).size!==4))fail('invalid construction queue');
 if(size(p.sections)>32768)fail('section content exceeds 32 KiB');
 for(const key of ['decisions','questions','roadmap','chat','history'])if(!Array.isArray(p[key]))fail('invalid '+key);
 if(p.decisions.length>64||p.questions.length>32||p.roadmap.length>48||p.chat.length>40||p.history.length>6)fail('collection budget exceeded');
 for(const d of p.decisions)if(typeof d.text!=='string'||d.text.length>2000||!['approved','assumption','proposed','rejected'].includes(d.status))fail('invalid decision');
 for(const q of p.questions)if(typeof q!=='string'||q.length>2000)fail('invalid question');
 for(const [i,m] of p.roadmap.entries()){for(const field of ['id','stage','title','deliverable','validation'])if(typeof m?.[field]!=='string'||m[field].length>2000)fail('invalid milestone: roadmap['+i+'].'+field+' must be text (maximum 2000 characters)');if(!['planned','delivered'].includes(m.status))fail('invalid milestone: roadmap['+i+'].status must be planned or delivered');}
 if(new Set(p.roadmap.map(m=>m.id)).size!==p.roadmap.length)fail('duplicate milestone identity');
 for(const c of p.chat)if(!['user','assistant'].includes(c.role)||typeof c.text!=='string'||c.text.length>8000)fail('invalid chat entry');
 if(size(p.chat)>24000||size(p.history)>65000||size(p)>140000)fail('document/history budget exceeded');
 for(const h of p.history){if(!Number.isSafeInteger(h.revision)||typeof h.label!=='string'||!h.snapshot||h.snapshot.history)fail('invalid history snapshot');validatePmd({...h.snapshot,history:[]});}
 if(p.phase==='ready'&&(!p.approvals.definition||!p.approvals.planning||!p.sections.length))fail('ready document requires approvals and sections');return p;
}
export function pmdIndex(p){return sectionIndex(p.sections).map(({id,title,parentId})=>({id,title,parentId}));}
function checkpoint(p,label){const {history,...snapshot}=clone(p);const list=[...p.history,{revision:p.revision,label:label.slice(0,160),snapshot}].slice(-6);while(size(list)>65000)list.shift();return list;}
export function updatePmd(previous,patch,label='Edit document'){
 validatePmd(previous);const next=clone(previous);for(const key of Object.keys(patch))if(!['sections','decisions','questions','roadmap','chat','construction'].includes(key))fail('patch cannot change '+key);
 if(Object.entries(patch).every(([key,value])=>JSON.stringify(previous[key])===JSON.stringify(value)))return next;Object.assign(next,clone(patch));const identities=list=>list.map(m=>m.id).sort().join('\n');if(patch.roadmap&&JSON.stringify(patch.roadmap)!==JSON.stringify(previous.roadmap)&&next.approvals.planning&&(previous.phase==='ready'||identities(patch.roadmap)!==identities(previous.roadmap)||previous.construction&&JSON.stringify(patch.roadmap.map(({status,...m})=>m))!==JSON.stringify(previous.roadmap.map(({status,...m})=>m)))){next.approvals.planning=false;next.phase=next.approvals.definition?'planning':'definition';delete next.construction;}next.history=checkpoint(previous,label);next.revision++;validatePmd(next);return next;
}
export function advancePmd(previous,action){const next=clone(previous);next.history=checkpoint(previous,'Workflow: '+action);next.revision++;
 if(action==='approve-definition'&&next.phase==='definition'){next.approvals.definition=true;next.decisions=next.decisions.map(d=>d.status==='proposed'?{...d,status:'approved'}:d);next.phase='planning';}
 else if(action==='approve-plan'&&next.phase==='planning'){if(!next.roadmap.length)fail('add deliverable milestones before approving the plan');next.approvals.planning=true;next.phase='critique';}
 else if(['request-critique','skip-critique'].includes(action)&&next.phase==='critique'){next.approvals.critique=action==='skip-critique';if(action==='skip-critique')next.phase='construction';}
 else if(action==='finish-critique'&&next.phase==='critique'){next.approvals.critique=true;next.phase='construction';}
 else if(action==='finish'&&next.phase==='construction'){if(!next.sections.length)fail('create linked document sections first');next.phase='ready';}
 else if(['revisit','revisit-definition','revisit-planning'].includes(action)){next.phase=action==='revisit-planning'?'planning':'definition';next.approvals={definition:action==='revisit-planning'&&next.approvals.definition,planning:false,critique:false};delete next.construction;}
 else fail('invalid workflow action for this phase');validatePmd(next);return next;
}
export function restorePmd(previous,revision){const h=previous.history.find(v=>v.revision===revision);if(!h)fail('history version unavailable');const next={...clone(h.snapshot),revision:previous.revision+1,history:checkpoint(previous,'Restore '+revision)};validatePmd(next);return next;}
export function importPmd(value){validatePmd(value);return {...clone(value),history:[],chat:value.chat.slice(-40)};}
export function selectedPmdContext(p,{conversation=false}={}){if(!p)return null;validatePmd(p);return {phase:p.phase,revision:p.revision,approvals:p.approvals,index:pmdIndex(p),decisions:p.decisions.slice(0,conversation?64:16).map(d=>({...d,text:d.text.slice(0,256)})),roadmap:p.roadmap.map(m=>({id:m.id,title:m.title,status:m.status})),questions:p.questions.slice(0,conversation?32:8).map(q=>q.slice(0,256))};}
