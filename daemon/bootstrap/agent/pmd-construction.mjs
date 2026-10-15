import {hash} from './work-orders.mjs';
import {updatePmd,advancePmd} from '../../../engine/project/pmd.mjs';
const required=[['overview','Project Master Document'],['requirements','Approved requirements'],['technical','Technical design'],['roadmap','Development roadmap']];
export const constructionScope=p=>hash({decisions:p.decisions,roadmap:p.roadmap.map(({status,...m})=>m)});
export function beginConstruction(p){
 if(p.phase!=='construction')return p;
 const sections=new Map(p.sections.map(s=>[s.id,s]));
 for(const [id,title]of required)if(!sections.has(id))sections.set(id,{id,title,parentId:id==='overview'?null:'overview',links:[],text:''});
 const overview=sections.get('overview');sections.set('overview',{...overview,links:[...new Set([...overview.links,'requirements','technical','roadmap'])]});
 const roadmap=sections.get('roadmap');if(!roadmap.text.trim())sections.set('roadmap',{...roadmap,text:p.roadmap.map(m=>`## ${m.id} · ${m.title}\nStage: ${m.stage}\nDeliverable: ${m.deliverable}\nValidation: ${m.validation}`).join('\n\n')});
 return updatePmd(p,{sections:[...sections.values()],construction:{scopeHash:constructionScope(p),requiredIds:required.map(([id])=>id)}},'Begin section construction');
}
export function constructionStatus(p){
 if(!p?.construction)return null;
 const pending=p.construction.requiredIds.filter(id=>!(p.sections.find(s=>s.id===id)?.text?.trim().length>=20));
 // Coverage belongs to the whole roadmap subtree, not just its parent page.
 const ids=new Set(['roadmap']);let added=true;while(added){added=false;for(const section of p.sections)if(ids.has(section.parentId)&&!ids.has(section.id)){ids.add(section.id);added=true;}}
 const normalize=text=>text.normalize('NFKC').replace(/\s+/g,' ').trim();
 const roadmap=normalize(p.sections.filter(s=>ids.has(s.id)).map(s=>s.id+' '+s.title+' '+s.text).join(' '));
 const uncovered=p.roadmap.filter(m=>!roadmap.includes(normalize(m.id))||!roadmap.includes(normalize(m.deliverable))||!roadmap.includes(normalize(m.validation))).map(m=>m.id);
 const nextAction=pending.length?'Write only the pending sections: '+pending.join(', '):uncovered.length?'Document these approved milestones under roadmap, including their exact deliverable and validation: '+uncovered.join(', '):p.construction.scopeHash!==constructionScope(p)?'Approved scope changed; revisit planning.':'Construction is complete.';
 return {missingMilestones:p.roadmap.filter(m=>uncovered.includes(m.id)).map(({id,deliverable,validation})=>({id,deliverable,validation})),nextAction,total:p.construction.requiredIds.length,completed:p.construction.requiredIds.length-pending.length,pending,uncoveredMilestones:uncovered,scopeChanged:p.construction.scopeHash!==constructionScope(p),ready:!pending.length&&!uncovered.length&&p.construction.scopeHash===constructionScope(p)};
}
export function finishConstruction(p){
 const status=constructionStatus(p);
 return status?.ready&&p.phase==='construction'?advancePmd(p,'finish'):p;
}
