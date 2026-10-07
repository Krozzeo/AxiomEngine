// Project paths are portable, relative authoring paths, never OS paths.
export const fileRoots=['Assets','Scripts','Scenes'];
export function projectPath(value){
 if(typeof value!=='string'||!value||value.length>240||value.includes('\\')||value.startsWith('/')||value.split('/').some(p=>!p||p==='.'||p==='..'||/[<>:"|?*\u0000-\u001f]/.test(p)||/[. ]$/.test(p)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(p)))throw Error('Invalid portable project path');
 return value;
}
export const parentPath=path=>path.includes('/')?path.slice(0,path.lastIndexOf('/')):'';
export const leafName=path=>path.slice(path.lastIndexOf('/')+1);
export function scriptTemplate(name){
 const identifier=name.replace(/\.cs$/i,'');if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier))throw Error('C# script name must be a valid identifier');
 return `using Axiom.Gameplay;\nnamespace Game;\npublic sealed class ${identifier} : Script {\n public override void OnStart() {\n }\n public override void OnUpdate(double deltaSeconds) {\n }\n public override void OnStop() {\n }\n}\n`;
}
export function projectFiles(scene){
 if(scene.projectFiles)return structuredClone(scene.projectFiles);
 return [...fileRoots.map(path=>({path,kind:'folder'})),...(scene.assets??[]).map(a=>({path:'Assets/'+leafName(a.name).replace(/[<>:"|?*\\\u0000-\u001f]/g,'_'),kind:'asset',assetId:a.id})),...(scene.script?[{path:'Scripts/Game.cs',kind:'script',text:scene.script.source}]:[])];
}
export function validateFiles(scene){
 const files=scene.projectFiles;if(!files)return;
 if(!Array.isArray(files)||files.length>512)throw Error('Project file budget is 512 entries');
 const paths=new Set();let bytes=0;
 for(const f of files){projectPath(f.path);const key=f.path.toLowerCase();if(paths.has(key))throw Error('Duplicate project path');paths.add(key);
  if(!['folder','asset','script','json'].includes(f.kind))throw Error('Invalid project file kind');
  if(f.kind==='asset'&&!scene.assets?.some(a=>a.id===f.assetId))throw Error('Project file references a missing asset');
  if(['script','json'].includes(f.kind)){if(typeof f.text!=='string')throw Error('Project text file needs content');bytes+=new TextEncoder().encode(f.text).length;if(bytes>65536)throw Error('Project text files exceed 64 KiB');}
 }
 for(const f of files){const parent=parentPath(f.path);if(parent&&!files.some(d=>d.path===parent&&d.kind==='folder'))throw Error('Project file parent directory missing');}
 for(const root of fileRoots)if(!files.some(f=>f.path===root&&f.kind==='folder'))throw Error('Project root folders cannot be removed');
}
export function editProjectFiles(scene,data){
 const files=projectFiles(scene),lookup=path=>files.find(f=>f.path===path),exists=path=>files.some(f=>f.path.toLowerCase()===path.toLowerCase());
 const destination=path=>{projectPath(path);const parent=parentPath(path);if(parent&&lookup(parent)?.kind!=='folder')throw Error('Destination folder does not exist');};
 const roots=paths=>paths.filter(p=>!paths.some(other=>other!==p&&p.startsWith(other+'/')));
 if(data.action==='create'){
  destination(data.path);if(exists(data.path))throw Error('A file with that name already exists');
  const kind=data.kind;if(!['folder','script','json'].includes(kind))throw Error('Create folder, C# script or JSON file');
  files.push({path:data.path,kind,...(kind==='script'?{text:scriptTemplate(leafName(data.path))}:kind==='json'?{text:'{}\n'}:{})});
 }else if(data.action==='move'){
  const source=lookup(data.path);if(!source||fileRoots.includes(source.path))throw Error('Select a movable file or folder');
  destination(data.to);if(data.to===data.path)return files;if(data.to.startsWith(data.path+'/'))throw Error('Cannot move a folder inside itself');
  const moving=files.filter(f=>f.path===data.path||f.path.startsWith(data.path+'/'));
  for(const f of moving){const next=data.to+f.path.slice(data.path.length);if(files.some(other=>!moving.includes(other)&&other.path.toLowerCase()===next.toLowerCase()))throw Error('Destination already exists');}
  for(const f of moving){const old=leafName(f.path);f.path=data.to+f.path.slice(data.path.length);if(f.kind==='script'&&old!==leafName(f.path)){const next=leafName(f.path).replace(/\.cs$/i,'');scriptTemplate(next);const previous=old.replace(/\.cs$/i,'');f.text=f.text.replace(new RegExp('\\b'+previous+'\\b','g'),next);}}
 }else if(data.action==='copy'){
  const selected=roots(data.paths??[]);if(!selected.length)throw Error('Select project files to copy');destination(data.to?data.to+'/copy': 'copy');
  for(const path of selected){const source=lookup(path);if(!source)throw Error('Copied file no longer exists');let target=(data.to?data.to+'/':'')+leafName(path),n=1;const ext=source.kind==='folder'?'':(leafName(path).match(/\.[^.]+$/)?.[0]??'');const stem=leafName(path).slice(0,ext? -ext.length:undefined);while(exists(target))target=(data.to?data.to+'/':'')+stem+'_Copy'+n+++ext;if(target===path||target.startsWith(path+'/'))throw Error('Cannot copy a folder inside itself');
   const entries=files.filter(f=>f.path===path||f.path.startsWith(path+'/')).map(f=>({...structuredClone(f),path:target+f.path.slice(path.length)}));for(const f of entries){if(f.kind==='script'&&parentPath(f.path)===data.to){const old=leafName(path).replace(/\.cs$/i,''),name=leafName(f.path).replace(/\.cs$/i,'');scriptTemplate(name);f.text=f.text.replace(new RegExp('\\b'+old+'\\b','g'),name);}}files.push(...entries);
  }
 }else if(data.action==='delete'){
  const paths=roots(data.paths??[]);if(!paths.length||paths.some(p=>fileRoots.includes(p)||!lookup(p)))throw Error('Select removable files');
  for(let i=files.length-1;i>=0;i--)if(paths.some(p=>files[i].path===p||files[i].path.startsWith(p+'/')))files.splice(i,1);
 }else throw Error('Unknown project file operation');
 validateFiles({...scene,projectFiles:files});return files;
}
