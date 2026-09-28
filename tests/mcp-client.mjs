import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {resolve} from 'node:path';
export async function mcpClient(daemon){
 const child=spawn(process.execPath,[resolve('daemon/mcp/stdio.mjs')],{env:{...process.env,AXIOM_DAEMON_ORIGIN:daemon.origin,AXIOM_SESSION_TOKEN:daemon.token},stdio:['pipe','pipe','pipe']});
 let sequence=0;const pending=new Map();let stderr='';child.stderr.on('data',c=>stderr+=c.toString());
 createInterface({input:child.stdout}).on('line',line=>{const value=JSON.parse(line);const p=pending.get(value.id);if(p){clearTimeout(p.timer);pending.delete(value.id);p.resolve(value);}});
 child.on('exit',()=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('MCP exited: '+stderr));}pending.clear();});
 function request(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('MCP request timed out: '+method));},35000);pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});}
 const hello=await request('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'axiom-external-agent-test',version:'1'}});if(hello.error)throw Error(JSON.stringify(hello));child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 return {request,async call(name,args={}){const response=await request('tools/call',{name,arguments:args});if(response.error||response.result.isError)throw Object.assign(Error(JSON.stringify(response)),{response});return response.result;},async close(){child.stdin.end();await new Promise(resolve=>{if(child.exitCode!==null)return resolve();child.once('exit',resolve);setTimeout(()=>child.kill(),2000).unref();});}};
}
