import {SCRIPT_SDK_VERSION} from './sdk-version.mjs';
import {readFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url);
let loaded;
export async function scriptingReference(){if(!loaded)loaded=Promise.all([readFile(new URL('reference/catalog.json',root),'utf8'),...['Sdk.cs','Compatibility.cs','GeneratedComponents.cs'].map(name=>readFile(new URL('templates/'+name,root),'utf8').then(text=>({name,text})))]).then(([json,...sources])=>({catalog:JSON.parse(json),sources}));return loaded;}
export async function readScriptingReference(query){
 const {catalog,sources}=await scriptingReference(),index=catalog.sections.map(({id,title,parentId})=>({id,title,parentId}));
 if(/^(?:index|scripting api|api)$/i.test(query.trim()))return {sdkVersion:SCRIPT_SDK_VERSION,engineVersion:catalog.version,index,instructions:'Select a type or member from this index. Pending Unity APIs are not available Axiom APIs.'};
 const words=query.split(/[.\s,]+/).filter(Boolean).map(w=>w.toLowerCase());
 const page=catalog.sections.find(s=>s.id===query)??catalog.sections.find(s=>s.sourceTypes?.includes(query))??catalog.sections.find(s=>s.sourceTypes&&s.id.toLowerCase()===query.toLowerCase())??catalog.sections.find(s=>s.id.toLowerCase()===query.toLowerCase())??catalog.sections.find(s=>s.sourceTypes&&words.includes(s.title.toLowerCase()));
 const matches=[];for(const source of sources){const lines=source.text.split('\n');for(let i=0;i<lines.length;i++)if(words.some(w=>new RegExp('\\b'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(lines[i]))&&/public|enum|class|struct/.test(lines[i]))matches.push({file:source.name,line:i+1,source:lines.slice(Math.max(0,i-1),i+5).join('\n')});}
 return {sdkVersion:SCRIPT_SDK_VERSION,engineVersion:catalog.version,available:!!page||matches.length>0,section:page?{id:page.id,title:page.title,text:page.text}:null,matches:matches.slice(0,12),truncated:matches.length>12,...(!page&&!matches.length?{reason:'No implemented member/type matches this query in the current SDK.',nextAction:'Do not guess aliases or repeatedly search. Explain the missing capability, use a documented alternative if it satisfies the task, or stop with work.block.',index}:{})};
}
