import {control} from './editor-controls.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {startServer} from '../../daemon/bootstrap/server.mjs';
import {envelope} from '../../protocol/src/protocol.ts';
import {imageFixture} from '../fixtures.mjs';
const root=await mkdtemp(join(tmpdir(),'axiom-m4-')),evidence=resolve('.axiom/browser-m4-evidence');await mkdir(evidence,{recursive:true});
const daemon=await startServer({projectRoot:root});let browser,page;const errors=[],report={criteria:[]};
async function state(){const r=await fetch(daemon.origin+'/v1/commands',{method:'POST',headers:{Origin:daemon.origin,Authorization:'Bearer '+daemon.token,'Content-Type':'application/json'},body:JSON.stringify(envelope('command',{type:'scene.get',data:{}}))});return(await r.json()).payload.data;}
try {
 browser=await chromium.launch({headless:false,channel:'chromium',args:['--no-sandbox','--enable-gpu','--enable-unsafe-webgpu','--enable-unsafe-swiftshader','--enable-features=Vulkan','--use-angle=vulkan','--use-vulkan=swiftshader','--use-webgpu-adapter=swiftshader','--disable-vulkan-surface','--disable-dev-shm-usage']});
 page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(180000);
 await page.goto(daemon.editorUrl);await (await control(page,'#project-name')).fill('M4 C# gameplay');await (await control(page,'input[name="project-dimension"][value="empty"]')).check();await (await control(page,'#project-new')).click();
 await (await control(page,'#asset-file')).setInputFiles({name:'player.png',mimeType:'image/png',buffer:imageFixture()});await (await control(page,'#asset-import')).click();
 await page.waitForFunction(()=>document.querySelector('#asset-list').options.length===1);await (await control(page,'#asset-place')).click();
 await page.waitForFunction(()=>document.querySelectorAll('#entities .entity').length===1);
 await page.waitForFunction(()=>document.querySelector('#script-source').value.includes('GameScript'));
 const source=(await page.locator('#script-source').inputValue()).replace('public sealed class GameScript : Script {','public sealed class GameScript : Script { private bool later;').replace('public override void OnUpdate(double deltaSeconds) {','public override void OnUpdate(double deltaSeconds) { if(Input.IsDown("Space") && !later) { later=true; Entity.Spawn(Entity.Transform.Position+new Vec3(-2,0,0)); }');
 let navigations=0;page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
 async function compile(text,expected='completed') {
  await (await control(page,'#script-source')).fill(text);await (await control(page,'#script-compile')).click();
  await page.waitForFunction(expected=>document.querySelector('#script-status').textContent==='Compilation '+expected&&!document.querySelector('#script-compile').disabled,expected);
 }
 await compile(source);const authoring=(await state()).project.scene;assert.equal(authoring.entities.length,1);report.criteria.push('compile generated SDK and attach C#');
 const cookie=(await page.context().cookies()).find(c=>c.name==='axiom-runtime');assert.ok(cookie?.httpOnly);assert.equal(cookie.sameSite,'Strict');
 const scriptUrl=daemon.origin+'/script-runtime/'+(await state()).project.id.slice(10)+'/'+authoring.script.build.id+'/';
 assert.equal((await fetch(scriptUrl+'dotnet.js',{headers:{Origin:daemon.origin}})).status,403);
 assert.equal((await fetch(scriptUrl+'dotnet.js',{headers:{Origin:'https://attacker.invalid',Cookie:cookie.name+'='+cookie.value}})).status,403);
 assert.equal((await fetch(scriptUrl+'Game.cs',{headers:{Origin:daemon.origin,Cookie:cookie.name+'='+cookie.value}})).status,404);
 assert.equal((await fetch(scriptUrl.replace(authoring.script.build.id,'00000000-0000-4000-8000-000000000000')+'dotnet.js',{headers:{Origin:daemon.origin,Cookie:cookie.name+'='+cookie.value}})).status,404);
 report.criteria.push('runtime bundle cookie, origin and build authority');
 await (await control(page,'#play-start')).click();await page.waitForFunction(()=>{try{const d=JSON.parse(document.querySelector('#frame-trace').textContent);return d.script.active&&d.script.entities.length===2&&d.kernel.meshes===2;}catch{return false;}});
 const before=await page.locator('#viewport').screenshot();let diagnostic=await page.locator('#frame-trace').textContent();const initial=JSON.parse(diagnostic);const x=initial.script.entities[0].position[0];
 await (await control(page,'#viewport')).click();await page.keyboard.down('ArrowRight');
 // Reaffirming the same active view/redrawing authoring controls must not release held input.
 await (await control(page,'#game-tab')).click();
 await page.waitForFunction(x=>JSON.parse(document.querySelector('#frame-trace').textContent).script.entities[0].position[0]>x+.2,x);await page.keyboard.up('ArrowRight');
 const after=await page.locator('#viewport').screenshot({path:join(evidence,'csharp-movement.png')});assert.notDeepEqual(before,after);assert.deepEqual((await state()).project.scene,authoring);
 const frameBeforeSpawn=JSON.parse(await page.locator('#frame-trace').textContent()).kernel.frame;
 await page.keyboard.down('Space');await page.waitForFunction(()=>JSON.parse(document.querySelector('#frame-trace').textContent).script.entities.length===3);await page.keyboard.up('Space');
 assert.ok(JSON.parse(await page.locator('#frame-trace').textContent()).kernel.frame>frameBeforeSpawn,'Runtime spawn must preserve the Rust clock');
 report.criteria.push('Transform and Input move rendered Rust world','spawn runtime entity','authoring isolation');
 await compile('using Axiom.Gameplay; namespace Game; public sealed class GameScript : Script { syntax error }','failed');
 assert.match(await page.locator('#script-diagnostics').textContent(),/Game.cs:\d+:\d+ CS/);assert.deepEqual((await state()).project.scene,authoring);
 await page.waitForFunction(()=>JSON.parse(document.querySelector('#frame-trace').textContent).script.active);report.criteria.push('compile error locations and last good runtime');
 await compile(source.replace('C# started:','C# reloaded:').replace('deltaSeconds*2','deltaSeconds*4'));
 await page.waitForFunction(g=>{const d=JSON.parse(document.querySelector('#frame-trace').textContent);return d.script.active&&d.script.generation>g&&d.script.entities.length===2;},initial.script.generation);
 assert.equal(navigations,0);await page.waitForFunction(()=>document.querySelector('#logs').textContent.includes('C# reloaded:'));report.criteria.push('edit compile reload without page navigation','causal lifecycle logs');
 await (await control(page,'#play-stop')).click();await page.waitForFunction(()=>document.querySelector('#play-stop').disabled);assert.equal((await state()).project.scene.entities.length,1);
 await (await control(page,'#scene-save')).click();await page.waitForFunction(()=>document.querySelector('#project-status').textContent.includes('Saved'));
 await (await control(page,'#project-close')).click();await (await control(page,'#project-open')).click();await (await control(page,'#play-start')).click();await page.waitForFunction(()=>{try{return JSON.parse(document.querySelector('#frame-trace').textContent).script.active;}catch{return false;}});
 report.criteria.push('saved script bundle reopens');
 await (await control(page,'#play-stop')).click();await page.waitForFunction(()=>document.querySelector('#play-stop').disabled);
 // Modular script removal preserves the compiled source/build and is undoable.
 const attached=(await state()).project.scene.script.attachments;
 await (await control(page,'#script-remove')).click();await page.waitForFunction(()=>document.querySelector('#script-component').hidden);
 assert.equal((await state()).project.scene.script.attachments.length,0);
 await (await control(page,'#component-choice')).selectOption('Script');await (await control(page,'#component-add')).click();
 await page.waitForFunction(()=>!document.querySelector('#script-component').hidden);assert.deepEqual((await state()).project.scene.script.attachments,attached);
 await (await control(page,'#scene-undo')).click();assert.equal((await state()).project.scene.script.attachments.length,0);
 await (await control(page,'#scene-undo')).click();assert.deepEqual((await state()).project.scene.script.attachments,attached);
 report.criteria.push('Inspector script detach/reattach preserves build and attachments through Undo');
 await compile('using Axiom.Gameplay; namespace Game; public sealed class GameScript : Script { public override void OnUpdate(double deltaSeconds) { while(true) {} } }');
 await (await control(page,'#play-start')).click();await page.waitForFunction(()=>{try{return JSON.parse(document.querySelector('#frame-trace').textContent).script.fault?.includes('timed out');}catch{return false;}});
 await (await control(page,'#play-stop')).click();await page.waitForFunction(()=>document.querySelector('#play-stop').disabled);report.criteria.push('infinite script terminated and editor remains responsive');
 assert.equal((await state()).project.scene.entities.length,1);assert.deepEqual(errors,[]);
 report.passed=true;report.backend=await page.locator('#gpu-state').textContent();assert.match(report.backend,/WebGPU/);
 await page.screenshot({path:join(evidence,'editor.png')});console.log('M4_BROWSER='+JSON.stringify(report));
}catch(error){
 report.failure=error.message;
 if(page){report.frame=await page.locator('#frame-trace').textContent().catch(()=>null);console.error('M4_FAILURE_FRAME='+report.frame);console.error('M4_FAILURE_STATE='+await page.locator('body').innerText());console.error('M4_FAILURE_COMMAND_ERROR='+await page.locator('#project-error').textContent());console.error('M4_FAILURE_SCRIPT_STATUS='+await page.locator('#script-status').textContent());console.error('M4_FAILURE_SCRIPT_DIAGNOSTICS='+await page.locator('#script-diagnostics').textContent());await page.screenshot({path:join(evidence,'failure.png')}).catch(()=>{});}
 throw error;
}finally{report.errors=errors;await writeFile(join(evidence,'report.json'),JSON.stringify(report,null,2));await browser?.close();await daemon.close();await rm(root,{recursive:true,force:true});}
