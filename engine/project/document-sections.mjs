// Shared ordered hierarchy for PMD and scripting-reference navigation.
export function sectionIndex(sections,parentId=null,depth=0){return sections.filter(s=>s.parentId===parentId).flatMap(s=>[{id:s.id,title:s.title,parentId,depth},...sectionIndex(sections,s.id,depth+1)]);}
export function sectionIndexMarkdown(sections){return sectionIndex(sections).map(s=>'  '.repeat(s.depth)+'- '+s.title).join('\n')+'\n';}
export function moveSection(sections,id,parentId,beforeId=null){
 const section=sections.find(s=>s.id===id);if(!section)throw Error('Section does not exist');
 if(parentId!==null&&!sections.some(s=>s.id===parentId))throw Error('Parent does not exist');
 let ancestor=parentId;while(ancestor!==null){if(ancestor===id)throw Error('A section cannot contain itself or its ancestors');ancestor=sections.find(s=>s.id===ancestor)?.parentId??null;}
 if(beforeId===id)return structuredClone(sections);
 if(beforeId!==null&&!sections.some(s=>s.id===beforeId&&s.parentId===parentId))throw Error('Insertion position is outside the destination');
 const result=sections.filter(s=>s.id!==id).map(s=>({...s})),at=beforeId===null?result.length:result.findIndex(s=>s.id===beforeId);result.splice(at,0,{...section,parentId});return result;
}
export function removeSection(sections,id){
 const removed=new Set([id]);let changed=true;while(changed){changed=false;for(const s of sections)if(removed.has(s.parentId)&&!removed.has(s.id)){removed.add(s.id);changed=true;}}
 return sections.filter(s=>!removed.has(s.id)).map(s=>({...s,links:s.links.filter(id=>!removed.has(id))}));
}
