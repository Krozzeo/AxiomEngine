import {appendFile,mkdir} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';
import {dirname,join} from 'node:path';
export class GitHubHistory{
 constructor(statePath){this.root=statePath?join(dirname(statePath),'github-history'):null;this.memory=new Map();}
 filename(id){if(!/^project:\/\/[0-9a-f-]{36}$/.test(id))throw Error('Open a valid project for GitHub history');return this.root&&join(this.root,id.slice(10)+'.jsonl');}
 async add(id,action,detail={}){if(!id)return;const file=this.filename(id),entry={at:new Date().toISOString(),action,...detail};if(file){await mkdir(this.root,{recursive:true});await appendFile(file,JSON.stringify(entry)+'\n',{mode:0o600});}else{const list=this.memory.get(id)??[];list.push(entry);this.memory.set(id,list);}}
 async list(id,before){const file=this.filename(id),items=[];let total=0;const take=entry=>{total++;if(before===undefined||total<before){items.push({...entry,index:total});if(items.length>100)items.shift();}};
  if(file){const input=createReadStream(file,{encoding:'utf8'});const lines=createInterface({input,crlfDelay:Infinity});try{for await(const line of lines)if(line)take(JSON.parse(line));}catch(error){if(error.code!=='ENOENT')throw error;}finally{lines.close();input.destroy();}}
  else for(const entry of this.memory.get(id)??[])take(entry);
  return {projectId:id,total,items:items.reverse(),before:items.at(-1)?.index>1?items.at(-1).index:null};
 }
}
