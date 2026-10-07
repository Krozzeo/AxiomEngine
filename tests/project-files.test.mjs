import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {projectPath,editProjectFiles,scriptTemplate} from '../engine/scene/project-files.mjs';
test('Project file operations reject traversal, Windows aliases, cycles and case collisions',()=>{
 for(const value of ['../secret','/tmp/a','C:/a','Assets/../a','Assets\\a','Assets/CON.cs','Assets/name.','Assets/a\0b'])assert.throws(()=>projectPath(value));
 const scene={entities:[]};scene.projectFiles=editProjectFiles(scene,{action:'create',kind:'folder',path:'Assets/Work'});
 assert.throws(()=>editProjectFiles(scene,{action:'move',path:'Assets/Work',to:'Assets/Work/Child'}));assert.throws(()=>editProjectFiles(scene,{action:'create',kind:'folder',path:'assets'}));assert.throws(()=>editProjectFiles(scene,{action:'delete',paths:['Assets']}));
});
test('Folder moves and copies preserve nested paths, regenerate C# names and retain asset IDs',()=>{
 let scene={entities:[],assets:[{id:'asset://abc',name:'Cube.glb'}]};for(const data of [{action:'create',kind:'folder',path:'Scripts/AI'},{action:'create',kind:'script',path:'Scripts/AI/Enemy.cs'},{action:'move',path:'Scripts/AI',to:'Scripts/Controllers'},{action:'copy',paths:['Scripts/Controllers'],to:'Scripts'},{action:'copy',paths:['Scripts/Controllers/Enemy.cs'],to:'Scripts/Controllers'}])scene.projectFiles=editProjectFiles(scene,data);
 assert.ok(scene.projectFiles.some(f=>f.path==='Scripts/Controllers_Copy1/Enemy_Copy1.cs'));assert.match(scene.projectFiles.find(f=>f.path==='Scripts/Controllers/Enemy_Copy2.cs').text,/class Enemy_Copy2 : Script/);assert.equal(scene.projectFiles.find(f=>f.kind==='asset').assetId,'asset://abc');assert.match(scriptTemplate('Player.cs'),/OnUpdate\(double deltaSeconds\)/);
});
test('File revisions, Undo and save/reopen preserve authoring files; copied entities remap hierarchy',async t=>{
 const root=await mkdtemp(join(tmpdir(),'axiom-files-'));t.after(()=>rm(root,{recursive:true,force:true}));const w=new SceneWorkspace(new ProjectStore(root));await w.run('project.create',{name:'Files'});const args=data=>({id:w.project.id,expectedSceneRevision:w.revision,...data});await w.run('project.files.edit',args({action:'create',kind:'script',path:'Scripts/Player.cs'}));const stale=args({action:'create',kind:'folder',path:'Assets/Old'});await w.run('scene.entity.create',args({name:'Parent'}));const parent=w.project.scene.entities.at(-1);await w.run('scene.entity.create',args({name:'Child',parentId:parent.id}));assert.equal(w.project.scene.entities.at(-1).parentId,parent.id);
 await assert.rejects(w.run('project.files.edit',stale),/Scene changed/);await w.run('scene.entities.paste',args({entities:w.project.scene.entities}));const [p,c]=w.project.scene.entities.slice(-2);assert.notEqual(p.id,parent.id);assert.equal(c.parentId,p.id);await w.run('scene.undo',args());assert.equal(w.project.scene.entities.length,2);await w.run('scene.save',args());const id=w.project.id;await w.run('project.close',args());await w.run('project.open',{id});assert.match(w.project.scene.projectFiles.find(f=>f.path==='Scripts/Player.cs').text,/class Player : Script/);
});
test('Deleting the last referenced asset or attached script source is rejected; unreferenced deletion preserves aliases',()=>{
 const source=scriptTemplate('Controller.cs');let scene={entities:[{renderable:{assetId:'asset://cube'}}],assets:[{id:'asset://cube',name:'Cube.glb'}],script:{source,attachments:['e1']}};
 scene.projectFiles=editProjectFiles(scene,{action:'create',kind:'folder',path:'Assets/Unused'});
 assert.throws(()=>editProjectFiles(scene,{action:'delete',paths:['Assets/Cube.glb']}),/referenced/);
 assert.throws(()=>editProjectFiles(scene,{action:'delete',paths:['Scripts/Game.cs']}),/Detach/);
 scene.projectFiles=editProjectFiles(scene,{action:'copy',paths:['Assets/Cube.glb'],to:'Assets/Unused'});
 scene.projectFiles=editProjectFiles(scene,{action:'delete',paths:['Assets/Cube.glb']});assert.equal(scene.assets.length,1);
 scene.entities=[];scene.projectFiles=editProjectFiles(scene,{action:'delete',paths:['Assets/Unused']});assert.equal(scene.assets.length,0);
});
test('Explorer exports literal canonical names and source bytes without a shell or implicit import',async t=>{
 const {readFile,readdir}=await import('node:fs/promises'),{EventEmitter}=await import('node:events'),{revealProjectFiles}=await import('../daemon/bootstrap/project-explorer.mjs');
 const root=await mkdtemp(join(tmpdir(),'axiom-explorer-'));t.after(()=>rm(root,{recursive:true,force:true}));let launchArgs;
 const scene={entities:[]};scene.projectFiles=editProjectFiles(scene,{action:'create',kind:'script',path:'Scripts/Controller.cs'});
 const workspace={project:{id:'project://test',scene},store:{directory:async()=>root,filename:()=> 'test.json'}};
 const result=await revealProjectFiles(workspace,'Scripts/Controller.cs',(...args)=>{launchArgs=args;const child=new EventEmitter();child.unref=()=>{};queueMicrotask(()=>child.emit('spawn'));return child;});
 assert.equal(result.revealed,true);assert.match(await readFile(result.path,'utf8'),/class Controller/);assert.equal(launchArgs[2].shell,false);assert.match(result.notice,/not imported automatically/);
 await assert.rejects(revealProjectFiles(workspace,'../outside'),/Invalid/);for(let i=0;i<3;i++)await revealProjectFiles(workspace,'');assert.equal((await readdir(join(root,'test.files'))).length,3);assert.ok(result.path.startsWith(root));
});
test('C# names are unique across folders; invalid edits preserve the canonical files',()=>{
 const scene={entities:[]};for(const data of [{action:'create',kind:'folder',path:'Scripts/A'},{action:'create',kind:'folder',path:'Scripts/B'},{action:'create',kind:'script',path:'Scripts/A/Player.cs'},{action:'create',kind:'script',path:'Scripts/B/Other.cs'}])scene.projectFiles=editProjectFiles(scene,data);
 const before=structuredClone(scene);assert.throws(()=>editProjectFiles(scene,{action:'create',kind:'script',path:'Scripts/B/player.cs'}),/unique/);assert.throws(()=>editProjectFiles(scene,{action:'move',path:'Scripts/B/Other.cs',to:'Scripts/B/Player.cs'}),/unique/);assert.deepEqual(scene,before);
});
test('Legacy folder copies open unchanged and normalize names only on an explicit file transaction',async()=>{
 const {projectFiles,validateFiles}=await import('../engine/scene/project-files.mjs');const source=scriptTemplate('Old.cs');const scene={entities:[],projectFiles:[...['Assets','Scripts','Scenes','Scripts/A','Scripts/B'].map(path=>({path,kind:'folder'})),{path:'Scripts/A/Old.cs',kind:'script',text:source},{path:'Scripts/B/Old.cs',kind:'script',text:source}]};const before=structuredClone(scene);validateFiles(scene);const view=projectFiles(scene);assert.equal(view.at(-1).path,'Scripts/B/Old_Copy1.cs');assert.match(view.at(-1).text,/class Old_Copy1/);assert.deepEqual(scene,before);scene.projectFiles=editProjectFiles(scene,{action:'write',path:'Scripts/B/Old_Copy1.cs',text:view.at(-1).text+'// edit\n'});validateFiles(scene,{uniqueScripts:true});
});
test('IDE source writes use revision, Undo/Redo and explicit save persistence',async t=>{
 const root=await mkdtemp(join(tmpdir(),'axiom-ide-'));t.after(()=>rm(root,{recursive:true,force:true}));const w=new SceneWorkspace(new ProjectStore(root));await w.run('project.create',{name:'IDE'});const args=data=>({id:w.project.id,expectedSceneRevision:w.revision,...data});await w.run('project.files.edit',args({action:'create',kind:'script',path:'Scripts/Edit.cs'}));const original=w.project.scene.projectFiles.at(-1).text,text=original+'// edited in IDE\n';await w.run('project.files.edit',args({action:'write',path:'Scripts/Edit.cs',text}));assert.equal(w.project.scene.projectFiles.at(-1).text,text);await w.run('scene.undo',args());assert.equal(w.project.scene.projectFiles.at(-1).text,original);await w.run('scene.redo',args());await w.run('scene.save',args());const id=w.project.id;await w.run('project.close',args());await w.run('project.open',{id});assert.equal(w.project.scene.projectFiles.at(-1).text,text);await assert.rejects(w.run('project.files.edit',args({action:'write',path:'Scripts/Edit.cs',text:'x'.repeat(65537)})),/64 KiB/);assert.equal(w.project.scene.projectFiles.at(-1).text,text);
});
test('Copy Path exports an absolute native path without launching Explorer',async t=>{
 const {isAbsolute}=await import('node:path'),{readFile}=await import('node:fs/promises'),{revealProjectFiles}=await import('../daemon/bootstrap/project-explorer.mjs');const root=await mkdtemp(join(tmpdir(),'axiom-path-'));t.after(()=>rm(root,{recursive:true,force:true}));const scene={entities:[]};scene.projectFiles=editProjectFiles(scene,{action:'create',kind:'script',path:'Scripts/Path.cs'});const workspace={project:{id:'project://copy',scene},store:{directory:async()=>root,filename:()=> 'copy.json'}};const result=await revealProjectFiles(workspace,'Scripts/Path.cs',null);assert.equal(result.revealed,false);assert.ok(isAbsolute(result.path));assert.match(await readFile(result.path,'utf8'),/class Path/);
});
