import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable,Writable} from 'node:stream';
import {createMcpSession,serveStdio,connection} from '../daemon/mcp/stdio.mjs';
const api=async(path,body)=>path==='/v1/handshake'?{capabilities:['agent.tools'],server:{version:'test'}}:path==='/v1/tools'?{tools:[{name:'scene.query',description:'Query',mutates:false,inputSchema:{type:'object'}}]}:{kind:'event',payload:{data:{base64:'png',frame:2}}};
const init={jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'test',version:'1'}}};
test('MCP negotiates, gates initialization, lists real tools and returns images separately',async()=>{
 const handle=createMcpSession(api);assert.equal((await handle({jsonrpc:'2.0',id:0,method:'tools/list'})).error.code,-32002);assert.equal((await handle(init)).result.protocolVersion,'2025-11-25');await handle({jsonrpc:'2.0',method:'notifications/initialized'});
 assert.equal((await handle({jsonrpc:'2.0',id:2,method:'tools/list'})).result.tools[0].name,'scene.query');
 assert.equal((await handle({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'shell'}})).error.code,-32602);
 const result=(await handle({jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'scene.query',arguments:{}}})).result;assert.equal(result.content[1].type,'image');assert.equal(result.structuredContent.payload.data.base64,undefined);
 assert.equal((await handle([])).error.code,-32600);
});
test('stdio handles fragmented lines, parse errors and notifications without stdout noise',async()=>{
 let out='';const data=JSON.stringify(init)+'\n'+JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\nnot-json\n'+JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/list'})+'\n';
 await serveStdio({input:Readable.from([Buffer.from(data.slice(0,15)),Buffer.from(data.slice(15))]),output:new Writable({write(chunk,encoding,done){out+=chunk;done();}}),api});const lines=out.trim().split('\n').map(JSON.parse);assert.equal(lines.length,3);assert.equal(lines[1].error.code,-32700);assert.equal(lines[2].result.tools.length,1);
});
test('stdio connector refuses remote origins and missing credentials',()=>{assert.throws(()=>connection({AXIOM_DAEMON_ORIGIN:'https://example.com',AXIOM_SESSION_TOKEN:'x'}),/loopback/);assert.throws(()=>connection({}),/TOKEN/);});
