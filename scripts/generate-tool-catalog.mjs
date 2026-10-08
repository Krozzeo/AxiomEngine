import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),dir=resolve(root,'protocol/schema');
const source=JSON.parse(await readFile(resolve(dir,'semantic-tools.json'),'utf8'));
async function expand(value) {
 if(Array.isArray(value))return Promise.all(value.map(expand));
 if(!value||typeof value!=='object')return value;
 if(value.$ref){const [file,pointer]=value.$ref.split('#');if(file!=='project-document.schema.json')throw Error('Unsupported canonical reference');let schema=JSON.parse(await readFile(resolve(dir,file),'utf8'));for(const key of pointer.slice(1).split('/'))schema=schema[key];schema=structuredClone(schema);if(value.partial)delete schema.required;return expand(schema);}
 const result={};for(const [key,child]of Object.entries(value))result[key]=await expand(child);
 if(result.type==='object'&&result.additionalProperties!==true)result.additionalProperties=false;
 return result;
}
const tools=await expand(source.tools);if(new Set(tools.map(t=>t.name)).size!==tools.length)throw Error('Duplicate tool');
const text=JSON.stringify({catalogVersion:1,generatedFrom:'protocol/schema/semantic-tools.json + project-document.schema.json',tools},null,2)+'\n',path=resolve(root,'protocol/tool-catalog.json');
if(process.argv.includes('--check')){if(await readFile(path,'utf8')!==text)throw Error('Tool catalog is stale; run npm run generate:tools');}else await writeFile(path,text);
console.log(`Tool catalog: ${tools.length} real semantic tools`);
