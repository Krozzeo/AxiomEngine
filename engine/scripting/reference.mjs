import {SCRIPT_SDK_VERSION} from './sdk-version.mjs';
import {readFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url);
let loaded;
export async function scriptingReference(){if(!loaded)loaded=Promise.all([readFile(new URL('reference/catalog.json',root),'utf8'),...['Sdk.cs','Compatibility.cs','RuntimeObjects.cs','Scheduling.cs','Physics.cs','PhysicsAdvanced.cs','ShapeCasts.cs','Input.cs','ProjectRuntime.cs','SceneManagement.cs','GeneratedComponents.cs'].map(name=>readFile(new URL('templates/'+name,root),'utf8').then(text=>({name,text})))]).then(([json,...sources])=>({catalog:JSON.parse(json),sources}));return loaded;}
export async function readScriptingReference(query){
 const {catalog,sources}=await scriptingReference(),index=catalog.sections.map(({id,title,parentId})=>({id,title,parentId}));
 if(/^(?:index|scripting api|api)$/i.test(query.trim()))return {sdkVersion:SCRIPT_SDK_VERSION,engineVersion:catalog.version,index,instructions:'Select a type or member from this index. Pending Unity APIs are not available Axiom APIs.'};
 const words=query.split(/[.\s,]+/).filter(Boolean).map(w=>w.toLowerCase());
 const page=catalog.sections.find(s=>s.id===query)??catalog.sections.find(s=>s.sourceTypes?.includes(query))??catalog.sections.find(s=>s.sourceTypes&&s.id.toLowerCase()===query.toLowerCase())??catalog.sections.find(s=>s.id.toLowerCase()===query.toLowerCase())??catalog.sections.find(s=>s.sourceTypes&&words.includes(s.title.toLowerCase()));
 const qualified=query.trim().match(/^(?:Axiom\.Gameplay\.)?([A-Za-z_]\w*)\.([A-Za-z_]\w*)(?:\(\))?$/);
 // A documented type is not evidence that every Unity member on it exists.
 const memberPages=page?[page]:[];for(let i=0;i<memberPages.length;i++){const declarations=memberPages[i].text.split('## Implemented declarations')[1]??'';for(const base of declarations.matchAll(/class\s+\w+\s*:\s*(\w+)/g)){const inherited=catalog.sections.find(s=>s.sourceTypes?.includes(base[1]));if(inherited&&!memberPages.includes(inherited))memberPages.push(inherited);}}
 const missingMember=!!qualified&&(!page||!memberPages.some(s=>new RegExp('\\b'+qualified[2]+'\\b').test(s.text.split('## Implemented declarations')[1]??'')));
 const matches=[];for(const source of sources){const lines=source.text.split('\n');for(let i=0;i<lines.length;i++)if(words.some(w=>new RegExp('\\b'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(lines[i]))&&/public|enum|class|struct/.test(lines[i]))matches.push({file:source.name,line:i+1,source:lines.slice(Math.max(0,i-1),i+5).join('\n')});}
 return {sdkVersion:SCRIPT_SDK_VERSION,engineVersion:catalog.version,available:!missingMember&&(!!page||matches.length>0),section:page?{id:page.id,title:page.title,text:page.text}:null,matches:matches.slice(0,4).map(match=>({...match,source:match.source.slice(0,2400),sourceTruncated:match.source.length>2400})),truncated:matches.length>4,...(missingMember||!page&&!matches.length?{reason:'No implemented member/type matches this query in the current SDK.',nextAction:'Do not guess aliases or repeatedly search. Explain the missing capability, use a documented alternative if it satisfies the task, or stop with work.block.',index}:{})};
}
