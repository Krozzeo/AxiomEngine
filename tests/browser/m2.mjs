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
const root=await mkdtemp(join(tmpdir(),"axiom-browser-m2-"));
const evidence=resolve(".axiom/browser-evidence");await mkdir(evidence,{recursive:true});
let daemon=await startServer({projectRoot:root});
let browser;
const errors=[];
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
  await page.goto(daemon.editorUrl);
  await page.waitForFunction(()=>document.querySelector("#connection").textContent.includes("Connected"));
  await page.waitForFunction(()=>/^WebGPU/.test(document.querySelector("#gpu-state").textContent));
  report.backend=await page.locator("#gpu-state").textContent();
  assert.match(report.backend,/^WebGPU/);report.criteria.push("open Axiom");
  await (await control(page,"#project-name")).fill("M2 browser acceptance");await (await control(page,'input[name="project-dimension"][value="empty"]')).check();await (await control(page,"#project-new")).click();
  await page.waitForFunction(()=>document.querySelector("#project-status").textContent.includes("M2 browser acceptance"));report.criteria.push("create project");
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
  // Persisted-render comparisons use the authored Game camera. Scene now has
  // an independent transient editor camera, verified by the M8 acceptance.
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
  for(const field of await page.locator("#entity-fields input, #entity-fields button").all()) assert.equal(await field.isDisabled(),true);
  assert.equal(await page.locator("#asset-import").isDisabled(),true);
  const editorImage=await page.screenshot({path:join(evidence,"play-editor.png")});
  if(process.env.CI && process.env.AXIOM_LOG_PREVIEW==="true") {
    const full=pixels(editorImage),preview=new PNG({width:720,height:500});
    for(let y=0;y<500;y++)for(let x=0;x<720;x++)full.data.copy(preview.data,(y*720+x)*4,((y*2)*full.width+x*2)*4,((y*2)*full.width+x*2)*4+4);
    console.log("M2_PREVIEW_PNG="+PNG.sync.write(preview).toString("base64"));
  }
  await (await control(page,"#play-stop")).click();await page.waitForFunction(()=>document.querySelector("#play-stop").disabled);
  assert.deepEqual((await state()).project,saved);report.criteria.push("Play without changing authoring state");
  await page.goto(daemon.origin+"/?renderer=null#token="+daemon.token);
  await page.waitForFunction(()=>{try{const k=JSON.parse(document.querySelector("#frame-trace").textContent).kernel;return k.renderer==="null"&&k.meshes===2&&k.frame>=15;}catch{return false;}});
  assert.match(await page.locator("#gpu-state").textContent(),/Null Renderer/);
  assert.deepEqual(errors,[]);
  report.pixelEvidence=colors(savedImage);report.nullParity=true;report.passed=report.criteria.length===11;
  await writeFile(join(evidence,"report.json"),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} catch(error) {
  if(browser) for(const context of browser.contexts())for(const page of context.pages()) {
    await page.screenshot({path:join(evidence,"failure.png")}).catch(()=>{});
    const detail=await page.locator("body").innerText().catch(()=>"");console.error("Browser failure state:\n"+detail);await writeFile(join(evidence,"failure.txt"),detail+"\n"+error.stack+"\n"+errors.join("\n"));
  }
  throw error;
} finally {await browser?.close();await daemon.close();await rm(root,{recursive:true,force:true});}
