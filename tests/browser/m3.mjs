import {control} from './editor-controls.mjs';
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import { mkdtemp,rm,mkdir,writeFile } from "node:fs/promises";
import { join,resolve } from "node:path";
import { tmpdir } from "node:os";
import { startServer } from "../../daemon/bootstrap/server.mjs";
import { imageFixture,glbFixture } from "../fixtures.mjs";
import { envelope } from "../../protocol/src/protocol.ts";
const root=await mkdtemp(join(tmpdir(),"axiom-browser-m3-"));
const evidence=resolve(".axiom/browser-m3-evidence");await mkdir(evidence,{recursive:true});
let daemon=await startServer({projectRoot:root});
let browser;
const errors=[],commandRequests=[];
const report={criteria:[],backend:null};
async function state() {
  const response=await fetch(daemon.origin+"/v1/commands",{method:"POST",headers:{Origin:daemon.origin,Authorization:`Bearer ${daemon.token}`,"Content-Type":"application/json"},body:JSON.stringify(envelope("command",{type:"scene.get",data:{}}))});
  assert.equal(response.status,200);return (await response.json()).payload.data;
}
function pixels(buffer) {return PNG.sync.read(buffer);}
function colors(buffer) {
  const {data}=pixels(buffer);let red=0,green=0;
  for(let i=0;i<data.length;i+=4) {if(data[i]>100&&data[i]>data[i+1]*1.5&&data[i]>data[i+2]*1.5)red++;if(data[i+1]>90&&data[i+1]>data[i]*1.4&&data[i+1]>data[i+2]*1.15)green++;}
  return {red,green};
}
try {
  browser=await chromium.launch({headless:process.env.AXIOM_HEADLESS!=="false",channel:"chromium",...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),args:["--no-sandbox","--enable-gpu","--enable-unsafe-webgpu","--enable-unsafe-swiftshader","--enable-features=Vulkan","--use-angle=vulkan","--use-vulkan=swiftshader","--use-webgpu-adapter=swiftshader","--disable-vulkan-surface","--disable-dev-shm-usage"]});
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});page.on("pageerror",error=>errors.push(error.message));
  page.setDefaultTimeout(30000);
  page.on('request',request=>{if(!request.url().endsWith('/v1/commands'))return;try{const payload=JSON.parse(request.postData()??'{}').payload;if(payload){commandRequests.push({type:payload.type,revision:payload.data?.expectedSceneRevision,assetId:payload.data?.assetId});if(commandRequests.length>24)commandRequests.shift();}}catch{}});
  await page.goto(daemon.editorUrl);
  await page.waitForFunction(()=>document.querySelector("#connection").textContent.includes("Connected"));
  await page.waitForFunction(()=>/^WebGPU/.test(document.querySelector("#gpu-state").textContent));
  report.backend=await page.locator("#gpu-state").textContent();
  assert.match(report.backend,/^WebGPU/);report.criteria.push("open Axiom");
  await (await control(page,"#project-name")).fill("M3 pipeline acceptance");await (await control(page,'input[name="project-dimension"][value="empty"]')).check();await (await control(page,"#project-new")).click();
  await page.waitForFunction(()=>document.querySelector("#project-status").textContent.includes("M3 pipeline acceptance"));report.criteria.push("create project");
  for(const [name,mimeType,buffer] of [["checker.png","image/png",imageFixture()],["cube.glb","model/gltf-binary",glbFixture()]]) {
    await (await control(page,"#asset-file")).setInputFiles({name,mimeType,buffer});await (await control(page,"#asset-import")).click();
    await page.waitForFunction(name=>[...document.querySelector("#asset-list").options].some(option=>option.textContent.includes(name)),name);
    await (await control(page,"#asset-list")).selectOption({label:(name.endsWith("png")?"sprite":"mesh")+" · "+name});
    await (await control(page,"#asset-place")).click();
    await page.waitForFunction(count=>document.querySelectorAll("#entities .entity").length===count,name.endsWith("png")?1:2);
  }
  {const snapshot=await state(),mesh=snapshot.project.scene.entities.find(e=>e.renderable?.kind==='mesh');const response=await fetch(daemon.origin+'/v1/commands',{method:'POST',headers:{Origin:daemon.origin,Authorization:'Bearer '+daemon.token,'Content-Type':'application/json'},body:JSON.stringify(envelope('command',{type:'scene.light.set',data:{id:snapshot.project.id,expectedSceneRevision:snapshot.sceneRevision,entityId:mesh.id,value:{kind:'directional',color:[1,1,1],intensity:1.5,range:10,direction:[0,0,-1],innerAngle:15,outerAngle:30,shadow:false}}}))});assert.equal((await response.json()).kind,'event');await (await control(page,'#workspace-refresh')).click();await page.waitForFunction(()=>document.querySelector('#editor-workspace').getAttribute('aria-busy')==='false');}
  report.criteria.push("import image and GLB","place sprite","place mesh");
  await page.waitForFunction(()=>{try{return JSON.parse(document.querySelector("#frame-trace").textContent).kernel.meshes===2;}catch{return false;}});
  // Compare persisted output through the authored Game camera, independent
  // of transient Scene navigation and camera seeding.
  await (await control(page,"#game-tab")).click();await page.waitForFunction(()=>{try{return JSON.parse(document.querySelector("#frame-trace").textContent).kernel.view==="game";}catch{return false;}});
  const initial=await page.locator("#viewport").screenshot();assert.ok(colors(initial).red>100&&colors(initial).green>100,"Both imported assets must produce colored pixels");
  await page.locator("#entities .entity").filter({hasText:"checker.png"}).click();
  await (await control(page,"#position-0")).fill("-1.8");await (await control(page,"#position-1")).fill("0.4");await page.locator('#position-1').press('Enter');
  await page.locator("#entities .entity").filter({hasText:"cube.glb"}).click();
  await (await control(page,"#position-0")).fill("1.7");await (await control(page,"#position-1")).fill("-0.3");await page.locator('#position-1').press('Enter');
  {const snapshot=await state();const response=await fetch(daemon.origin+'/v1/commands',{method:'POST',headers:{Origin:daemon.origin,Authorization:'Bearer '+daemon.token,'Content-Type':'application/json'},body:JSON.stringify(envelope('command',{type:'scene.camera.update',data:{id:snapshot.project.id,expectedSceneRevision:snapshot.sceneRevision,camera:{projection:'orthographic'}}}))});assert.equal((await response.json()).kind,'event');await (await control(page,'#workspace-refresh')).click();await page.waitForFunction(()=>document.querySelector('#editor-workspace').getAttribute('aria-busy')==='false');}
  await page.waitForFunction(()=>!document.querySelector("#scene-save").disabled);
  report.criteria.push("move both objects");
  await (await control(page,"#scene-save")).click();await page.waitForFunction(()=>document.querySelector("#project-status").textContent.includes("Saved")&&!document.querySelector("#scene-add").disabled);
  const saved=(await state()).project;assert.equal(saved.scene.entities.length,2);report.criteria.push("save");
  const savedImage=await page.locator("#viewport").screenshot({path:join(evidence,"scene.png")});
  assert.ok(!pixels(initial).data.equals(pixels(savedImage).data),"Moving objects and changing projection must change rendered pixels");
  await (await control(page,"#project-close")).click();await page.waitForFunction(()=>document.querySelectorAll("#entities .entity").length===0);report.criteria.push("close");
  await daemon.close();daemon=await startServer({projectRoot:root});
  await page.goto(daemon.editorUrl);await (await control(page,"#project-list")).selectOption(saved.id);await (await control(page,"#project-open")).click();
  await page.waitForFunction(()=>{try{return JSON.parse(document.querySelector("#frame-trace").textContent).kernel.meshes===2;}catch{return false;}});
  assert.deepEqual((await state()).project,saved);report.criteria.push("reopen");
  await (await control(page,"#game-tab")).click();await page.waitForFunction(()=>{try{return JSON.parse(document.querySelector("#frame-trace").textContent).kernel.view==="game";}catch{return false;}});
  const reopenedImage=await page.locator("#viewport").screenshot({path:join(evidence,"reopened.png")});
  assert.ok(pixels(reopenedImage).data.equals(pixels(savedImage).data),"Saved and reopened scene pixels must match exactly");report.criteria.push("see same scene");
  await page.locator("#entities .entity").filter({hasText:"cube.glb"}).click();
  assert.equal(await page.locator("#position-0").isEnabled(),true);
  await (await control(page,"#play-start")).click();await page.waitForFunction(()=>{try{const k=JSON.parse(document.querySelector("#frame-trace").textContent).kernel;return k.mode==="play"&&k.frame>=15&&k.meshes===2;}catch{return false;}});
  for(const field of await page.locator("#entity-fields input, #entity-fields button").all()) assert.equal(await field.isDisabled(),false);
  const authoredBefore=(await state()).project.scene;const target=authoredBefore.entities.find(e=>e.name.includes('cube.glb')),nextX=target.transform.position[0]+1;
  await page.locator('#position-0').fill(String(nextX));await page.locator('#position-0').press('Tab');await page.waitForFunction(({id,x})=>{try{return JSON.parse(document.querySelector('#frame-trace').textContent).script.entities.find(e=>e.id===id)?.position[0]===x;}catch{return false;}},{id:target.id,x:nextX});assert.deepEqual((await state()).project.scene,authoredBefore);report.criteria.push('Live Transform changes the running world while preserving authored transforms');
  assert.equal(await page.locator("#asset-import").isDisabled(),true);
  const editorImage=await page.screenshot({path:join(evidence,"play-editor.png")});
  if(process.env.CI && process.env.AXIOM_LOG_PREVIEW==="true") {
    const full=pixels(editorImage),preview=new PNG({width:720,height:500});
    for(let y=0;y<500;y++)for(let x=0;x<720;x++)full.data.copy(preview.data,(y*720+x)*4,((y*2)*full.width+x*2)*4,((y*2)*full.width+x*2)*4+4);
    console.log("M3_PREVIEW_PNG="+PNG.sync.write(preview).toString("base64"));
  }
  await (await control(page,"#play-stop")).click();await page.waitForFunction(()=>document.querySelector("#play-stop").disabled);
  assert.deepEqual((await state()).project,saved);report.criteria.push("Play without changing authoring state");
  // M3: update a source image shared by a sprite and a mesh, leaving a third source unchanged.
  async function command(type,data={}) {
    const response=await fetch(daemon.origin+"/v1/commands",{method:"POST",headers:{Origin:daemon.origin,Authorization:`Bearer ${daemon.token}`,"Content-Type":"application/json"},body:JSON.stringify(envelope("command",{type,data}))});
    const result=await response.json();assert.equal(result.kind,"event",JSON.stringify(result));return result.payload.data;
  }
  let current=await state();
  const texture=current.project.scene.assets.find(a=>a.kind==="sprite"),mesh=current.project.scene.assets.find(a=>a.kind==="mesh");
  const independent=glbFixture(d=>{d.materials[0].pbrMetallicRoughness.baseColorFactor=[.1,.8,.2,1];});
  await command("asset.import",{id:saved.id,expectedSceneRevision:current.sceneRevision,name:"independent.glb",base64:independent.toString("base64")});
  await (await control(page,"#workspace-refresh")).click();
  await page.waitForFunction(()=>document.querySelector("#asset-list").options.length===3);
  await (await control(page,"#asset-list")).selectOption(mesh.id);await (await control(page,"#asset-texture")).selectOption(texture.id);
  await (await control(page,"#asset-bind")).click();
  await page.waitForFunction(()=>document.querySelector("#asset-job-status").textContent==="Import completed"&&!document.querySelector("#asset-bind").disabled);
  const before=await state(),other=before.project.scene.assets.find(a=>a.name==="independent.glb");
  const beforeImage=await page.locator("#viewport").screenshot({path:join(evidence,"before-update.png")});
  const blue=new PNG({width:32,height:32});for(let i=0;i<blue.data.length;i+=4)blue.data.set([20,40,245,255],i);
  const source=PNG.sync.write(blue);
  const pageIdentity=await page.evaluate(()=>{globalThis.m3PageIdentity=crypto.randomUUID();return globalThis.m3PageIdentity;});
  // Use a second API client: event polling must refresh the existing editor without navigation.
  let job=(await command("asset.job.start",{id:saved.id,expectedSceneRevision:before.sceneRevision,operation:"replace",assetId:texture.id,name:"blue.png",base64:source.toString("base64")})).job;
  for(let i=0;i<200&&["queued","running"].includes(job.status);i++){await new Promise(r=>setTimeout(r,50));job=(await command("asset.job.get",{id:saved.id,jobId:job.id})).job;}
  assert.equal(job.status,"completed",JSON.stringify(job));assert.deepEqual(new Set(job.build.rebuilt),new Set([texture.id,mesh.id]));assert.deepEqual(job.build.unchanged,[other.id]);
  await page.waitForFunction(()=>document.querySelector("#project-status").textContent.includes("Unsaved"));
  // Wait for the new blue texture on both sprite and mesh, not just an updated document.
  let updatedImage;let bluePixels=0;
  for(let tries=0;tries<100;tries++) {
    updatedImage=await page.locator("#viewport").screenshot();const data=pixels(updatedImage).data;bluePixels=0;
    for(let i=0;i<data.length;i+=4)if(data[i+2]>100&&data[i+2]>data[i]*2&&data[i+2]>data[i+1]*2)bluePixels++;
    if(bluePixels>40000)break;await new Promise(r=>setTimeout(r,100));
  }
  assert.ok(bluePixels>40000,`Expected sprite and dependent mesh to change: ${bluePixels} blue pixels`);
  assert.ok(!pixels(updatedImage).data.equals(pixels(beforeImage).data),"Hot reload must change rendered pixels");await writeFile(join(evidence,"after-update.png"),updatedImage);
  assert.equal(await page.evaluate(()=>globalThis.m3PageIdentity),pageIdentity);
  current=await state();assert.deepEqual(current.project.scene.assets.map(a=>a.id),before.project.scene.assets.map(a=>a.id));assert.equal(current.project.scene.assets.find(a=>a.id===other.id).buildKey,other.buildKey);
  const why=await command("asset.explain",{id:saved.id,assetId:texture.id});assert.deepEqual(why.whatUses.assets,[mesh.id]);assert.equal(why.whatUses.entities.length,2);
  await (await control(page,"#scene-save")).click();await page.waitForFunction(()=>document.querySelector("#project-status").textContent.includes("Saved")&&!document.querySelector("#scene-add").disabled);
  const updated=(await state()).project;
  await (await control(page,"#project-close")).click();await page.waitForFunction(()=>document.querySelectorAll("#entities .entity").length===0);
  await daemon.close();daemon=await startServer({projectRoot:root});await page.goto(daemon.editorUrl);await (await control(page,"#project-list")).selectOption(saved.id);await (await control(page,"#project-open")).click();
  await page.waitForFunction(()=>{try{return JSON.parse(document.querySelector("#frame-trace").textContent).kernel.meshes===2;}catch{return false;}});
  await (await control(page,"#game-tab")).click();await page.waitForFunction(()=>{try{return JSON.parse(document.querySelector("#frame-trace").textContent).kernel.view==="game";}catch{return false;}});
  assert.deepEqual((await state()).project,updated);assert.ok(pixels(await page.locator("#viewport").screenshot()).data.equals(pixels(updatedImage).data),"Hot-reloaded saved Game pixels must survive restart");
  report.pipeline={hotReloadWithoutNavigation:true,bluePixels,rebuilt:job.build.rebuilt,unchanged:job.build.unchanged,stableIds:true,restartPreserved:true,diagnostics:true};
  await page.goto(daemon.origin+"/?renderer=null#token="+daemon.token);
  await page.waitForFunction(()=>{try{const k=JSON.parse(document.querySelector("#frame-trace").textContent).kernel;return k.renderer==="null"&&k.meshes===2&&k.frame>=15;}catch{return false;}});
  assert.match(await page.locator("#gpu-state").textContent(),/Null Renderer/);
  assert.deepEqual(errors,[]);
  report.pixelEvidence=colors(savedImage);report.nullParity=true;report.passed=report.criteria.length===11;
  await writeFile(join(evidence,"report.json"),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} catch(error) {
  await writeFile(join(evidence,"failure-state.json"),JSON.stringify(await state().catch(e=>({error:e.message})),null,2));
  if(browser) for(const context of browser.contexts())for(const page of context.pages()) {
    await page.screenshot({path:join(evidence,"failure.png")}).catch(()=>{});
    console.error('M3_UI_DIAGNOSTICS='+JSON.stringify({projectError:await page.locator('#project-error').textContent(),commandRequests}));
    const detail=await page.locator("body").innerText().catch(()=>"");console.error("Browser failure state:\n"+detail);await writeFile(join(evidence,"failure.txt"),detail+"\n"+error.stack+"\n"+errors.join("\n"));
  }
  throw error;
} finally {await browser?.close();await daemon.close();await rm(root,{recursive:true,force:true});}
