import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
export const MCP_VERSION='2025-11-25';
const MAX_LINE=12*1024*1024;
export function connection(env=process.env){
 const url=new URL(env.AXIOM_DAEMON_ORIGIN??'http://127.0.0.1:4317');
 if(url.protocol!=='http:'||!['127.0.0.1','localhost'].includes(url.hostname)||url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw Error('AXIOM_DAEMON_ORIGIN must be a loopback HTTP origin');
 if(!env.AXIOM_SESSION_TOKEN)throw Error('AXIOM_SESSION_TOKEN is required');
 return async(path,body)=>{
  const response=await fetch(url.origin+path,{method:body?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(30000),headers:{Origin:url.origin,Authorization:'Bearer '+env.AXIOM_SESSION_TOKEN,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  let bytes=0,chunks=[];for await(const chunk of response.body){bytes+=chunk.length;if(bytes>1024*1024)throw Error('Daemon response exceeds transport limit');chunks.push(chunk);}
  const value=JSON.parse(Buffer.concat(chunks).toString());if(!response.ok)throw Object.assign(Error(value.cause??'Daemon request failed'),{code:value.code});return value;
 };
}
export function createMcpSession(api){
 let initialized=false,ready=false,catalog=null;
 const error=(id,code,message)=>({jsonrpc:'2.0',id,error:{code,message}});
 return async message=>{
  const id=message?.id??null;
  if(!message||Array.isArray(message)||message.jsonrpc!=='2.0'||typeof message.method!=='string'||(Object.hasOwn(message,'id')&&typeof id!=='string'&&!Number.isSafeInteger(id)))return error(null,-32600,'Invalid JSON-RPC request');
  if(!Object.hasOwn(message,'id')){if(message.method==='notifications/initialized'&&initialized)ready=true;return null;}
  const result=value=>({jsonrpc:'2.0',id,result:value});
  if(message.method==='ping')return result({});
  if(message.method==='initialize'){
   if(initialized||typeof message.params?.protocolVersion!=='string'||!message.params?.clientInfo||!message.params?.capabilities)return error(id,-32602,'Invalid initialization');
   try{const handshake=await api('/v1/handshake');if(!handshake.capabilities.includes('agent.tools'))return error(id,-32603,'Daemon does not provide M5 agent tools');catalog=(await api('/v1/tools')).tools;initialized=true;return result({protocolVersion:MCP_VERSION,capabilities:{tools:{}},serverInfo:{name:'axiom-engine',version:handshake.server.version},instructions:'One shared authoring workspace. Query revision before mutating. Use entity.query and events.query for bounded context. Captures require an open, ready WebGPU editor. MAIN git branches are never changed by tools.'});}catch{return error(id,-32603,'Unable to connect to the authorized M5 daemon');}
  }
  if(!ready)return error(id,-32002,'Initialize and send notifications/initialized first');
  if(message.method==='tools/list'){
   const cursor=message.params?.cursor??'0';if(typeof cursor!=='string'||!/^\d+$/.test(cursor)||Number(cursor)>catalog.length)return error(id,-32602,'Invalid cursor');const offset=Number(cursor),items=catalog.slice(offset,offset+10).map(t=>({name:t.name,description:t.description,inputSchema:t.inputSchema,annotations:{readOnlyHint:!t.mutates,destructiveHint:t.mutates,openWorldHint:false}}));return result({tools:items,...(offset+items.length<catalog.length?{nextCursor:String(offset+items.length)}:{})});
  }
  if(message.method==='tools/call'){
   if(typeof message.params?.name!=='string'||!catalog.some(t=>t.name===message.params.name))return error(id,-32602,'Tool unavailable');
   try{
    const event=await api('/v1/tools/call',{name:message.params.name,arguments:message.params.arguments??{}}),value=structuredClone(event),image=value.payload?.data?.base64;
    if(image)delete value.payload.data.base64;
    const content=[{type:'text',text:JSON.stringify(value)}];if(image)content.push({type:'image',mimeType:'image/png',data:image});
    return result({content,structuredContent:value,isError:event.kind==='error'});
   }catch(e){return result({content:[{type:'text',text:JSON.stringify({code:e.code??'AX_AGENT_0002',cause:e.code?e.message:'Daemon unavailable or transport limit exceeded'})}],isError:true});}
  }
  return error(id,-32601,'Method not found');
 };
}
export async function serveStdio({input=process.stdin,output=process.stdout,api=connection()}={}){
 const handle=createMcpSession(api);let buffer=Buffer.alloc(0);
 async function send(value){if(value&&!output.write(JSON.stringify(value)+'\n'))await once(output,'drain');}
 for await(const chunk of input){buffer=Buffer.concat([buffer,chunk]);let newline;while((newline=buffer.indexOf(10))>=0){if(newline>MAX_LINE)throw Error('MCP input line exceeds limit');const line=buffer.subarray(0,newline).toString('utf8');buffer=buffer.subarray(newline+1);let value;try{value=JSON.parse(line);}catch{await send({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}});continue;}await send(await handle(value));}if(buffer.length>MAX_LINE)throw Error('MCP input line exceeds limit');}
}
if(process.argv[1]===fileURLToPath(import.meta.url))serveStdio().catch(()=>{process.stderr.write('Axiom MCP stopped: verify daemon origin, session token and transport limits.\n');process.exitCode=1;});
