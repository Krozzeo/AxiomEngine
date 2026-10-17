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
test('new task context never replays orphan provider calls from an interrupted request',()=>{
 const record={sourceId:'p',createdAt:'1',public:{id:'task',channel:'assistant',steps:[]},input:[{type:'function_call',call_id:'done',name:'read',arguments:'{}'},{type:'function_call_output',call_id:'done',output:'retained documentation'},{type:'function_call',call_id:'pending',name:'write',arguments:'{}'}]};const input=conversationInput(new Map([['task',record]]),{projectId:'p',channel:'assistant'});assert.equal(input.length,2);assert.equal(input[1].output,'retained documentation');
});
test('SDK documentation reads remain bounded even when common type names occur throughout the source',async()=>{
 const {readScriptingReference}=await import('../engine/scripting/reference.mjs');for(const query of ['Entity','Vector3','Input','Physics']){const result=await readScriptingReference(query);assert.ok(Buffer.byteLength(JSON.stringify(result))<32768,query+' result exceeds the semantic result budget');assert.ok(result.matches.length<=4);}
});

test('a known SDK type does not imply an invented member is implemented',async()=>{
 const {readScriptingReference}=await import('../engine/scripting/reference.mjs');
 for(const query of ['Transform.DoesNotExist','Physics.CapsuleCast','Input.GetGyroscope'])assert.equal((await readScriptingReference(query)).available,false,query);
 for(const query of ['Entity.IsGrounded','Transform.position','Transform.GetComponent','Physics.Raycast','Physics.SphereCast','Input.GetTouch','SceneManager.LoadScene','PlayerPrefs.Save'])assert.equal((await readScriptingReference(query)).available,true,query);
});

test('bodyless record declarations do not expose the following class as API members',async()=>{
 const {readScriptingReference}=await import('../engine/scripting/reference.mjs');
 assert.equal((await readScriptingReference('Bounds.Update')).available,false);
 assert.equal((await readScriptingReference('Rect.Awake')).available,false);
 assert.equal((await readScriptingReference('Color32.StartCoroutine')).available,false);
 assert.equal((await readScriptingReference('Bounds.Size')).available,true);
});
