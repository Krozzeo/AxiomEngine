import test from 'node:test';
import assert from 'node:assert/strict';
import {chatBlocks,chatInline,renderChatText} from '../apps/editor/src/chat-format.mjs';
test('shared chat Markdown formats headings, lists, quotes and fenced code',()=>{
 const blocks=chatBlocks('# Result\n\n**Done** and *ready*\n\n- Cube\n- Floor\n\n2. Check\n3. Play\n\n> Note\n\n```cs\n<unsafe>\n```');
 assert.deepEqual(blocks.map(b=>b.tag),['h1','p','ul','ol','blockquote','pre']);assert.equal(blocks[3].start,2);assert.deepEqual(blocks[2].items,['Cube','Floor']);assert.equal(blocks.at(-1).text,'<unsafe>');
 assert.deepEqual(chatInline('**Done** · *ready* · `x=2`').filter(n=>n.tag!=='text').map(n=>n.tag),['strong','em','code']);
});
test('model Markdown never becomes executable HTML or an unsafe link',()=>{
 const nodes=chatInline('<img src=x onerror=alert(1)> [bad](javascript:alert) [good](https://example.com/path)');assert.equal(nodes.filter(n=>n.tag==='a').length,1);assert.ok(nodes.some(n=>n.tag==='text'&&n.text.includes('<img')));assert.ok(nodes.some(n=>n.tag==='text'&&n.text.includes('javascript:')));
 class Node{constructor(tag){this.tag=tag;this.children=[];this.classList={add(){}};}append(...n){this.children.push(...n);}replaceChildren(){this.children=[];}}
 const document={createElement:t=>new Node(t),createTextNode:text=>({tag:'text',text})},root=new Node('div');renderChatText(document,root,'**Safe** <script>bad()</script>\n\n```html\n<img onerror=bad()>\n```\n\n[link](https://example.com)');
 assert.equal(root.children[0].children[0].tag,'strong');assert.ok(root.children[0].children.some(n=>n.text?.includes('<script>')));assert.equal(root.children[1].children[0].textContent,'<img onerror=bad()>');const link=root.children[2].children[0];assert.equal(link.rel,'noopener noreferrer');assert.equal(link.target,'_blank');
});
