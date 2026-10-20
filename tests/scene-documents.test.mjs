import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {runtimeProjectData} from '../engine/scripting/runtime-project.mjs';
import {renderingDefaults} from '../engine/renderer/render-plan.mjs';
import {syncSceneDocuments} from '../engine/scene/scene-documents.mjs';
import {twoDDefaults} from '../engine/renderer/two-d-plan.mjs';
const setup=async fn=>{const root=await mkdtemp(join(tmpdir(),'axiom-scenes-'));try{const w=new SceneWorkspace(new ProjectStore(root));const run=(type,data={})=>w.run(type,{id:w.project?.id,expectedSceneRevision:w.revision,...data});await run('project.create',{name:'Scene documents'});await fn(w,run);}finally{await rm(root,{recursive:true,force:true});}};
test('omitted rendering settings resolve on first open and remain identical after switching and reopening',()=>setup(async(w,run)=>{
 await run('scene.rendering.update',{value:{...renderingDefaults,exposure:1.3}});
 await run('project.files.edit',{action:'create',kind:'scene',path:'Scenes/Arena.scene',text:'{"format":"axiom-scene","version":1,"entities":[]}'});
 await run('scene.document.edit',{action:'open',path:'Scenes/Arena.scene'});const first=structuredClone(w.project.scene.rendering);assert.equal(first.exposure,1.3);
 await run('scene.document.edit',{action:'activate',path:'Scenes/Main Scene.scene'});await run('scene.rendering.update',{value:{...renderingDefaults,exposure:2}});
 await run('scene.document.edit',{action:'activate',path:'Scenes/Arena.scene'});assert.deepEqual(w.project.scene.rendering,first);
 await run('scene.document.edit',{action:'close',path:'Scenes/Arena.scene'});await run('scene.document.edit',{action:'open',path:'Scenes/Arena.scene'});assert.deepEqual(w.project.scene.rendering,first);
 await run('scene.save');const id=w.project.id;await run('project.close');await run('project.open',{id});assert.deepEqual(w.project.scene.rendering,first);
}));
test('sync does not inject active scene settings into inactive legacy documents',()=>setup(async(w,run)=>{
 await run('scene.document.edit',{action:'create',path:'Scenes/Legacy.scene'});await run('scene.document.edit',{action:'open',path:'Scenes/Legacy.scene'});await run('scene.document.edit',{action:'activate',path:'Scenes/Main Scene.scene'});
 const legacy=w.project.scene.projectFiles.find(f=>f.path==='Scenes/Legacy.scene');const data=JSON.parse(legacy.text);delete data.rendering;legacy.text=JSON.stringify(data);w.project.scene.rendering=structuredClone(renderingDefaults);syncSceneDocuments(w.project.scene);assert.equal(JSON.parse(legacy.text).rendering,undefined);
}));
test('first open preserves explicitly authored rendering instead of inheriting active exposure',()=>setup(async(w,run)=>{
 await run('scene.rendering.update',{value:{...renderingDefaults,exposure:2}});await run('project.files.edit',{action:'create',kind:'scene',path:'Scenes/Custom.scene',text:JSON.stringify({entities:[],rendering:{...renderingDefaults,exposure:.7}})});await run('scene.document.edit',{action:'open',path:'Scenes/Custom.scene'});assert.equal(w.project.scene.rendering.exposure,.7);
}));
test('opening explicit 2D and 3D scenes does not inherit the opposite rendering mode',()=>setup(async(w,run)=>{
 await run('scene.rendering.update',{value:renderingDefaults});await run('project.files.edit',{action:'create',kind:'scene',path:'Scenes/Flat.scene',text:JSON.stringify({entities:[],twoD:twoDDefaults,camera:{position:[0,0,6],target:[0,0,0],projection:'orthographic',orthoHeight:6,fov:60}})});await run('scene.document.edit',{action:'open',path:'Scenes/Flat.scene'});assert.ok(w.project.scene.twoD);assert.equal(w.project.scene.rendering,undefined);
 await run('project.files.edit',{action:'create',kind:'scene',path:'Scenes/Depth.scene',text:JSON.stringify({entities:[],rendering:renderingDefaults,camera:{position:[0,0,6],target:[0,0,0],projection:'perspective',orthoHeight:6,fov:60}})});await run('scene.document.edit',{action:'open',path:'Scenes/Depth.scene'});assert.ok(w.project.scene.rendering);assert.equal(w.project.scene.twoD,undefined);
}));
test('new project has a durable Main Scene and independent editable additive scenes',()=>setup(async(w,run)=>{
 assert.equal(w.project.scene.sceneDocuments.active,'Scenes/Main Scene.scene');await run('scene.entity.create',{name:'Main cube'});const main=w.project.scene.entities[0].id;
 await run('project.files.edit',{action:'create',kind:'scene',path:'Scenes/Other.scene',text:'{"entities":[]}'});await run('scene.document.edit',{action:'open',path:'Scenes/Other.scene'});await run('scene.entity.create',{name:'Other cube'});const other=w.project.scene.entities[1].id;
 assert.equal(w.project.scene.sceneDocuments.owners[other],'Scenes/Other.scene');assert.equal(w.project.scene.sceneDocuments.owners[main],'Scenes/Main Scene.scene');await run('scene.document.edit',{action:'close',path:'Scenes/Other.scene'});assert.deepEqual(w.project.scene.entities.map(e=>e.id),[main]);await run('scene.document.edit',{action:'open',path:'Scenes/Other.scene'});assert.equal(w.project.scene.entities[1].name,'Other cube');await run('scene.save');const id=w.project.id;await run('project.close');await run('project.open',{id});assert.equal(w.project.scene.entities.length,2);assert.equal(w.project.scene.sceneDocuments.active,'Scenes/Other.scene');assert.equal(runtimeProjectData(w.project).resources.filter(r=>r.type==='scene').length,2);
}));
test('open scene identity collisions reject atomically and close is undoable',()=>setup(async(w,run)=>{
 await run('scene.entity.create',{name:'Original'});const main=w.project.scene.projectFiles.find(f=>f.kind==='scene');await run('project.files.edit',{action:'create',kind:'scene',path:'Scenes/Copy.scene',text:main.text});const revision=w.revision;
 await assert.rejects(run('scene.document.edit',{action:'open',path:'Scenes/Copy.scene'}),/shares entity IDs/);assert.equal(w.revision,revision);assert.equal(w.project.scene.entities.length,1);
 await run('scene.document.edit',{action:'close',path:'Scenes/Main Scene.scene'});assert.equal(w.project.scene.entities.length,0);await run('scene.undo');assert.equal(w.project.scene.entities[0].name,'Original');
}));
test('open scene cannot be deleted or overwritten; malformed scenes leave workspace unchanged',()=>setup(async(w,run)=>{
 await assert.rejects(run('project.files.edit',{action:'delete',paths:['Scenes/Main Scene.scene']}),/Close the scene/);await assert.rejects(run('project.files.edit',{action:'write',path:'Scenes/Main Scene.scene',text:'{}'}),/Close the scene/);
 await run('project.files.edit',{action:'create',kind:'scene',path:'Scenes/Bad.scene',text:'{}'});await assert.rejects(run('scene.document.edit',{action:'open',path:'Scenes/Bad.scene'}),/65536 entities/);assert.deepEqual(w.project.scene.sceneDocuments.open,['Scenes/Main Scene.scene']);
}));
test('moving a root transfers subtree scene ownership and closing source preserves moved objects',()=>setup(async(w,run)=>{
 await run('scene.entity.create',{name:'Root'});const root=w.project.scene.entities[0].id;await run('scene.entity.create',{name:'Child'});const child=w.project.scene.entities[1].id;await run('scene.entity.reparent',{entityIds:[child],parentId:root});await run('scene.document.edit',{action:'create',path:'Scenes/Destination.scene',text:'{"entities":[]}'});await run('scene.document.edit',{action:'open',path:'Scenes/Destination.scene'});await run('scene.document.edit',{action:'move',path:'Scenes/Destination.scene',entityIds:[root]});assert.equal(w.project.scene.sceneDocuments.owners[child],'Scenes/Destination.scene');await run('scene.document.edit',{action:'close',path:'Scenes/Main Scene.scene'});assert.equal(w.project.scene.entities.length,2);
}));
test('closing last scene leaves no entities; reopening restores authored content',()=>setup(async(w,run)=>{await run('scene.entity.create',{name:'Saved'});await run('scene.document.edit',{action:'close',path:'Scenes/Main Scene.scene'});await run('scene.save');assert.equal(w.project.scene.sceneDocuments.active,null);await run('scene.document.edit',{action:'open',path:'Scenes/Main Scene.scene'});assert.equal(w.project.scene.entities[0].name,'Saved');}));
test('activating and closing scenes restores each scenes configured camera without duplicate active cameras',()=>setup(async(w,run)=>{await run('scene.example.create',{example:'Camera'});const camera=w.project.scene.entities.find(e=>e.camera);await run('scene.document.edit',{action:'create',path:'Scenes/Second.scene',text:'{"entities":[]}'});await run('scene.document.edit',{action:'open',path:'Scenes/Second.scene'});assert.equal(w.project.scene.entities.find(e=>e.id===camera.id).camera.active,false);await run('scene.example.create',{example:'Camera'});const second=w.project.scene.entities.find(e=>e.id!==camera.id&&e.camera);assert.ok(second.camera.active);await run('scene.document.edit',{action:'activate',path:'Scenes/Main Scene.scene'});assert.equal(w.project.scene.entities.find(e=>e.id===camera.id).camera.active,true);assert.equal(w.project.scene.entities.find(e=>e.id===second.id).camera.active,false);await run('scene.document.edit',{action:'close',path:'Scenes/Main Scene.scene'});assert.equal(w.project.scene.entities.find(e=>e.id===second.id).camera.active,true);}));
