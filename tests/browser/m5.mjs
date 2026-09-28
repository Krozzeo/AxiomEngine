import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {startServer} from '../../daemon/bootstrap/server.mjs';
import {mcpClient} from '../mcp-client.mjs';
import {imageFixture} from '../fixtures.mjs';
const root=await mkdtemp(join(tmpdir(),'axiom-m5-')),evidence=resolve('.axiom/browser-m5-evidence');await mkdir(evidence,{recursive:true});
const daemon=await startServer({projectRoot:root});let browser,page,client;const report={criteria:[],pageErrors:[]};
try{
 client=await mcpClient(daemon);
 const available=[];let cursor;do{const r=await client.request('tools/list',cursor?{cursor}:{});available.push(...r.result.tools);cursor=r.result.nextCursor;}while(cursor);assert.ok(available.some(t=>t.name==='renderer.capture'));assert.ok(!available.some(t=>t.name==='shell'));report.criteria.push('MCP subprocess initialization and paginated schema discovery');
 const call=async(name,args={})=>(await client.call(name,args)).structuredContent.payload.data;
 const created=await call('project.create',{name:'External agent scene'});const id=created.project.id;
 const mutation=async()=>({id,expectedSceneRevision:(await call('scene.query',{id})).sceneRevision});
 await call('scene.entity.create',{...await mutation(),name:'Agent sprite'});
 const entity=(await call('entity.query',{...await mutation(),name:'Agent sprite'})).items[0];
 await call('asset.import',{...await mutation(),name:'agent.png',base64:imageFixture().toString('base64')});const asset=(await call('asset.query',await mutation())).items[0];
 await call('scene.component.add',{...await mutation(),entityId:entity.id,component:'Renderable',value:{kind:'sprite',assetId:asset.id}});
 const stale=await mutation();await call('scene.entity.update',{...stale,entityId:entity.id,transform:{position:[0.5,0,0]}});
 await assert.rejects(client.call('scene.entity.delete',{...stale,entityId:entity.id}),/AX_SCENE_0002/);
 await assert.rejects(client.call('entity.query',{...await mutation(),maxBytes:1000000}),/AX_AGENT_0001/);
 assert.equal((await client.request('tools/call',{name:'shell'})).error.code,-32602);
 await assert.rejects(client.call('renderer.capture',await mutation()),/AX_AGENT_0002/);
 report.criteria.push('create entity, import asset, add component and edit through MCP','stale revision, context limit, unavailable tool and absent renderer rejection');
 browser=await chromium.launch({headless:false,channel:'chromium',args:['--no-sandbox','--enable-gpu','--enable-unsafe-webgpu','--enable-unsafe-swiftshader','--enable-features=Vulkan','--use-angle=vulkan','--use-vulkan=swiftshader','--use-webgpu-adapter=swiftshader','--disable-vulkan-surface','--disable-dev-shm-usage']});
 page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>report.pageErrors.push(e.message));await page.goto(daemon.editorUrl);
 async function ready(){const deadline=Date.now()+30000;while(Date.now()<deadline){const s=await call('runtime.status');if(s.editor.connected&&s.editor.sceneRevision===s.sceneRevision&&s.editor.renderer==='webgpu')return s;await new Promise(r=>setTimeout(r,300));}throw Error('Editor did not reach the current revision');}
 await ready();await call('play.start',await mutation());const running=await ready();assert.equal(running.playing,true);assert.equal(running.editor.playing,true);
 const shot=await client.call('renderer.capture',{...await mutation(),width:640,height:360,maxEntities:8});const pixels=Buffer.from(shot.content.find(c=>c.type==='image').data,'base64');await writeFile(join(evidence,'agent-capture.png'),pixels);const png=PNG.sync.read(pixels);assert.equal(png.width,640);assert.equal(png.height,360);const colors=new Set();for(let i=0;i<png.data.length;i+=4)colors.add(png.data.subarray(i,i+3).toString('hex'));assert.ok(colors.size>2,'Capture must contain real rendered asset pixels');
 const semantic=shot.structuredContent.payload.data;assert.equal(semantic.semantic.entities[0].id,entity.id);assert.equal(semantic.renderer,'webgpu');assert.ok(semantic.frame>0);
 const errors=await call('diagnostics.query',{maxBytes:4096});assert.ok(errors.items.some(e=>e.code==='AX_SCENE_0002'));
 const delta=await call('events.query',{since:0,maxBytes:2048});assert.ok(delta.nextSince>0);assert.ok(Buffer.byteLength(JSON.stringify(delta))<=2048);
 await call('play.stop',await mutation());assert.equal((await ready()).editor.playing,false);
 // External edits must update the already-open editor, not merely a daemon snapshot.
 await call('scene.entity.update',{...await mutation(),entityId:entity.id,transform:{position:[-1,0,0]}});await ready();const next=await client.call('renderer.capture',await mutation());assert.notEqual(next.content.find(c=>c.type==='image').data,shot.content.find(c=>c.type==='image').data);
 await call('scene.save',await mutation());await assert.rejects(client.call('renderer.capture',{...await mutation(),channel:'depth'}),/AX_AGENT_0001/);
 assert.deepEqual(report.pageErrors,[]);await page.screenshot({path:join(evidence,'editor.png')});
 report.criteria.push('play and stop synchronized to real editor without clicks','renderer-owned PNG plus same-frame semantic capture','bounded error and event deltas','external edits refresh an already-open editor');report.passed=true;report.capture={width:png.width,height:png.height,colors:colors.size,bytes:pixels.length};console.log('M5_BROWSER='+JSON.stringify(report));
}catch(error){report.failure=error.message;if(page){console.error(await page.locator('body').innerText());await page.screenshot({path:join(evidence,'failure.png')}).catch(()=>{});}throw error;}
finally{await writeFile(join(evidence,'report.json'),JSON.stringify(report,null,2));await client?.close();await browser?.close();await daemon.close();await rm(root,{recursive:true,force:true});}
