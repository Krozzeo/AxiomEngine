import test from 'node:test';
import assert from 'node:assert/strict';
import {moveSection,removeSection,sectionIndexMarkdown} from '../engine/project/document-sections.mjs';
import {conversationInput} from '../daemon/bootstrap/agent/conversation-memory.mjs';
const sections=[{id:'a',title:'A',parentId:null,links:['c']},{id:'b',title:'B',parentId:'a',links:[]},{id:'c',title:'C',parentId:null,links:[]}];
test('ordered section movement prevents cycles, supports root and sibling insertion, repairs deletion links',()=>{
 assert.throws(()=>moveSection(sections,'a','b'),/ancestors/);assert.throws(()=>moveSection(sections,'c',null,'b'),/destination/);
 assert.equal(sectionIndexMarkdown(moveSection(sections,'b',null,'a')),'- B\n- A\n- C\n');
 assert.deepEqual(removeSection(sections,'a').map(s=>s.id),['c']);assert.deepEqual(removeSection(sections,'c')[0].links,[]);assert.equal(sections[1].parentId,'a');
});
test('conversation context reuses actual tool outputs only within the project and channel',()=>{
 const record={sourceId:'p',createdAt:'1',public:{id:'task',channel:'assistant',steps:[]},input:[{role:'developer',content:'obsolete current state'},{type:'function_call',call_id:'1',name:'read',arguments:'{}'},{type:'function_call_output',call_id:'1',output:'real SDK documentation'}]};
 const sessions=new Map([['task',record]]);assert.equal(conversationInput(sessions,{projectId:'p',channel:'assistant'})[1].output,'real SDK documentation');assert.deepEqual(conversationInput(sessions,{projectId:'p',channel:'pmd'}),[]);assert.deepEqual(conversationInput(sessions,{projectId:'other',channel:'assistant'}),[]);
});
test('scripting index resolves real types and documents unsupported lookups explicitly',async()=>{
 const {readScriptingReference}=await import('../engine/scripting/reference.mjs');const index=await readScriptingReference('index');assert.ok(index.index.some(s=>s.title==='Transform'));const physics=await readScriptingReference('Physics');assert.equal(physics.available,true);assert.equal(physics.section.id,'Physics');assert.match(physics.section.text,/Raycast/);const unknown=await readScriptingReference('NavMesh.CalculatePath');assert.equal(unknown.available,false);assert.match(unknown.reason,/No implemented/);
});
