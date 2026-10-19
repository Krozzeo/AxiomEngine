import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {projectFiles,projectPath} from '../../../engine/scene/project-files.mjs';
import {materializeLegacyScripts} from '../../../engine/scripting/fields.mjs';
import {validateProject} from '../../../protocol/src/project-document.mjs';
import {githubError} from './client.mjs';
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function publicationPrefix(id){if(!/^project:\/\/[0-9a-f-]{36}$/.test(id))throw githubError('Open a valid project');return 'axiom/'+id.slice(10)+'/';}
export async function projectBundle(workspace){
 const saved=(await workspace.store.run('project.open',{id:workspace.project.id})).project;
 const authoring=scene=>{const copy=structuredClone(scene);delete copy.assetDbVersion;for(const asset of copy.assets??[]){asset.sourceId??=asset.id;delete asset.buildKey;delete asset.lastBuild;}return copy;};
 if(saved.revision!==workspace.project.revision||!isDeepStrictEqual(authoring(saved.scene),authoring(JSON.parse(workspace.savedScene))))throw githubError('The saved project changed. Reopen it before publishing.');
 const project=structuredClone(saved);materializeLegacyScripts(project.scene);project.scene.projectFiles=projectFiles(project.scene);delete project.scene.script;
 for(const asset of project.scene.assets??[]){delete asset.buildKey;delete asset.lastBuild;}
 project.scene.projectFiles=projectFiles(project.scene).map(file=>{const value={...file};delete value.metadata;return value;});
 const editor={};if(project.editor?.masterDocument)editor.masterDocument=project.editor.masterDocument;if(project.editor?.pmd){editor.pmd=structuredClone(project.editor.pmd);editor.pmd.chat=[];editor.pmd.history=[];}if(Object.keys(editor).length)project.editor={leftWidth:240,rightWidth:320,bottomHeight:240,...editor};else delete project.editor;
 validateProject(project);
 const files=new Map(),id=project.id.slice(10);const put=(path,bytes)=>{projectPath(path);if(files.has(path))throw githubError('Duplicate source path');files.set(path,Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes));};
 put(id+'.json',JSON.stringify(project,null,2)+'\n');
 // Reopenable canonical JSON plus readable source files. No compilation output, workspaces, account settings or derived asset caches.
 for(const f of project.scene.projectFiles){if(f.kind==='script'||f.kind==='scene'||f.kind==='json')put(f.path,f.text??'');}
 const sources=new Set((project.scene.assets??[]).map(a=>a.sourceId??a.id));
 for(const source of sources)put(id+'.assets/'+source.slice(8)+'.bin',await workspace.assets.readBytes(project.id,source));
 put('README.md','# '+project.name+'\n\nSaved Axiom game project. Open this directory through Axiom Hub (choose its parent as project storage). The UUID JSON and matching .assets directory are canonical; imported/compiled resources are rebuilt. Scripts and scenes are also provided as readable source copies. Publication does not include credentials, proposal previews, build output or caches.\n');
 let size=0;for(const bytes of files.values())size+=bytes.length;if(files.size>2048||size>16*1024*1024)throw githubError('Publication supports up to 2048 source files and 16 MiB; reduce the project before publishing.');
 const hashes=Object.fromEntries([...files].sort(([a],[b])=>a.localeCompare(b)).map(([path,bytes])=>[path,hash(bytes)]));return {projectId:project.id,name:project.name,revision:saved.revision,files,hashes,snapshotHash:hash(JSON.stringify(hashes)),bytes:size,prefix:publicationPrefix(project.id)};
}
export function remoteManifest(value,projectId){
 if(!value)return null;if(value.version!==1||value.projectId!==projectId||typeof value.snapshotHash!=='string'||!/^[a-f0-9]{64}$/.test(value.snapshotHash)||!value.files||typeof value.files!=='object'||Array.isArray(value.files)||Object.keys(value.files).length>2048)throw githubError('This remote folder is not a compatible publication of this project');
 for(const [path,digest]of Object.entries(value.files)){projectPath(path);if(!/^[a-f0-9]{64}$/.test(digest))throw githubError('Remote source manifest is invalid');}return value;
}
