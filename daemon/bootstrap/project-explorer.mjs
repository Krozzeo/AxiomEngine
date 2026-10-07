import {mkdir,lstat,open} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {projectFiles,projectPath} from '../../engine/scene/project-files.mjs';
// Explorer views are explicit exports of the canonical authoring draft. Never
// execute a project file or pass its path through a shell.
export async function revealProjectFiles(workspace,path='',launch=spawn){
 if(path)projectPath(path);
 const files=projectFiles(workspace.project.scene);if(path&&!files.some(f=>f.path===path))throw Error('Project path missing');
 const base=await workspace.store.directory(),name=workspace.store.filename(workspace.project.id).replace(/\.json$/,'.files');
 let root=join(base,name);await mkdir(root,{recursive:true});if((await lstat(root)).isSymbolicLink())throw Error('Explorer directory cannot be a link');
 root=join(root,randomUUID());await mkdir(root);
 let bytes=0;
 for(const f of files){const parts=f.path.split('/');let target=root;for(const part of parts.slice(0,-1)){target=join(target,part);await mkdir(target,{recursive:true});}target=join(target,parts.at(-1));if(f.kind==='folder'){await mkdir(target,{recursive:true});continue;}
  const value=f.kind==='asset'?await workspace.assets.readBytes(workspace.project.id,workspace.project.scene.assets.find(a=>a.id===f.assetId).sourceId??f.assetId):Buffer.from(f.text??'');bytes+=value.length;if(bytes>64*1024*1024)throw Error('Explorer export exceeds 64 MiB');const handle=await open(target,'wx',0o600);try{await handle.writeFile(value);}finally{await handle.close();}
 }
 const selected=path?join(root,...path.split('/')):root,platform=process.platform,command=platform==='win32'?'explorer.exe':platform==='darwin'?'open':'xdg-open';const record=files.find(f=>f.path===path),args=platform==='win32'&&record?.kind!=='folder'?['/select,',selected]:[record?.kind==='folder'||!path?selected:join(selected,'..')];
 const revealed=await new Promise(resolve=>{try{const child=launch(command,args,{shell:false,stdio:'ignore'});child.once('error',()=>resolve(false));child.once('spawn',()=>{child.unref?.();resolve(true);});}catch{resolve(false);}});
 return {revealed,path:selected,notice:'Explorer export of the current authoring draft. Edit through Project; changes to this export are not imported automatically.'};
}
