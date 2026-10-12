import {randomUUID} from 'node:crypto';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {extractPmdImport} from '../pmd-import.mjs';
import {hash,workError} from './work-orders.mjs';
export class ContextAttachments{
 constructor(root){this.root=root;}
 async add(projectId,data){const extraction=await extractPmdImport(data),id='attachment://'+randomUUID(),value={id,projectId,name:data.name,text:extraction.text,hash:hash(extraction.text),warnings:extraction.warnings,pmd:extraction.pmd};await mkdir(this.root,{recursive:true});await writeFile(join(this.root,id.slice(13)+'.json'),JSON.stringify(value),{mode:0o600});return value;}
 async get(projectId,id){if(!/^attachment:\/\/[a-f0-9-]{36}$/.test(id))throw workError('Invalid attachment identity');const value=JSON.parse(await readFile(join(this.root,id.slice(13)+'.json'),'utf8'));if(value.projectId!==projectId)throw workError('Attachment belongs to another project');return value;}
}
