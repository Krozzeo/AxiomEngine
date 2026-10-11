import test from 'node:test';
import assert from 'node:assert/strict';
import {pmdConversation} from '../apps/editor/src/pmd-editor.mjs';
test('PMD optimistic chat starts without a project, isolates projects and reconciles one message permanently',()=>{
 assert.equal(pmdConversation(undefined,null,undefined).entries.length,1);assert.equal(pmdConversation(undefined,null,undefined).pending,null);
 const chat=[{role:'assistant',text:'Question'}],pending={projectId:'one',text:'Answer',baseChat:JSON.stringify(chat)};
 assert.equal(pmdConversation(chat,pending,undefined).entries.length,1);assert.equal(pmdConversation(chat,pending,'two').entries.length,1);
 const waiting=pmdConversation(chat,pending,'one');assert.equal(waiting.entries.at(-1).text,'Answer');assert.equal(waiting.entries.length,2);
 const persisted=[...chat,{role:'user',text:'Answer'},{role:'assistant',text:'Recorded'}],done=pmdConversation(persisted,pending,'one');assert.equal(done.entries.length,3);assert.equal(done.pending,null);assert.equal(pmdConversation(chat,done.pending,'one').entries.length,1);
});
