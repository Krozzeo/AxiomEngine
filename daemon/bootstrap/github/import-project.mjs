import {mkdtemp,mkdir,writeFile,rm,readdir,lstat} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {validateProject} from '../../../protocol/src/project-document.mjs';
import {repositoryName,branchName,githubError} from './client.mjs';
export async function addLocalProject(store,path){
 if(!store.folders)throw Error('Choose persistent folder storage in Hub Settings first');
 if(typeof path!=='string'||!path.trim()||path.length>1024)throw Error('Choose a project folder');
 const stat=await lstat(path);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Choose an ordinary project folder');
 const files=(await readdir(path)).filter(n=>/^[0-9a-f-]{36}\.json$/.test(n));if(files.length!==1)throw Error('Select the project folder containing exactly one Axiom UUID JSON file');
 return {...await store.importLegacy(path),id:'project://'+files[0].slice(0,-5)};
}
export async function githubProjects(client,{repository,branch}){
 repository=repositoryName(repository);const repo=await client.request('/repos/'+repository);branch=branchName(branch||repo.default_branch);const head=await client.head(repository,branch);if(!head)throw githubError('Source branch does not exist');const tree=await client.tree(repository,head);
 const items=tree.filter(f=>f.type==='blob'&&f.mode==='100644'&&/(^|\/)[0-9a-f-]{36}\.json$/.test(f.path)).map(f=>({path:f.path,id:'project://'+f.path.split('/').at(-1).slice(0,-5)}));
 if(!items.length)throw githubError('No Axiom project found on this branch. Choose a repository containing a published Axiom project.');
 if(items.length>32)throw githubError('Select a repository with at most 32 Axiom projects');return {repository,branch,head,items,tree};
}
export async function importGitHubProject(store,client,data){
 if(!store.folders)throw Error('Choose persistent folder storage in Hub Settings first');
 const source=await githubProjects(client,data),project=source.items.find(p=>p.path===data.path)??(source.items.length===1?source.items[0]:null);if(!project)throw githubError('Choose the Axiom project to import');
 const prefix=project.path.slice(0,project.path.lastIndexOf('/')+1),uuid=project.id.slice(10),files=source.tree.filter(f=>f.type==='blob'&&(f.path===project.path||f.path.startsWith(prefix+uuid+'.assets/')));
 let size=0;for(const file of files){const path=file.path.slice(prefix.length);if(file.mode!=='100644'||path.split('/').some(p=>!p||p==='.'||p==='..'||p.includes('\\'))||!Number.isSafeInteger(file.size)||file.size<0)throw githubError('Invalid source file');size+=file.size;}
 if(files.length>2048||size>16*1024*1024)throw githubError('Import supports up to 2048 source files and 16 MiB');
 await store.directory();const stage=await mkdtemp(join(store.root,'.hub-import-'));
 try{for(const file of files){const result=await client.request('/repos/'+source.repository+'/git/blobs/'+file.sha);if(result.encoding!=='base64'||typeof result.content!=='string')throw githubError('Source blob could not be read');const bytes=Buffer.from(result.content.replace(/\s/g,''),'base64');if(bytes.length!==file.size)throw githubError('Source file size changed');const path=join(stage,file.path.slice(prefix.length));await mkdir(dirname(path),{recursive:true});await writeFile(path,bytes,{flag:'wx',mode:0o600});if(file.path===project.path){const document=JSON.parse(bytes.toString('utf8'));validateProject(document);if(document.id!==project.id)throw githubError('Project identity does not match its source file');}}
  return {...await addLocalProject(store,stage),repository:source.repository,branch:source.branch};
 }finally{await rm(stage,{recursive:true,force:true});}
}
