import {PNG} from 'pngjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
function sprite(color,ring=false){const p=new PNG({width:64,height:64});for(let y=0;y<64;y++)for(let x=0;x<64;x++){const edge=x<3||y<3||x>60||y>60;const a=ring&&!edge?35:255;const light=edge?1.15:0.85+0.15*(1-y/64);p.data.set([...color.map(c=>Math.min(255,Math.round(c*light))),a],(y*64+x)*4);}return PNG.sync.write(p);}
function cube(color){const pos=[-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5],ix=[0,1,2,0,2,3,1,5,6,1,6,2,5,4,7,5,7,6,4,0,3,4,3,7,3,2,6,3,6,7,4,5,1,4,1,0];const bin=Buffer.alloc(168);pos.forEach((v,i)=>bin.writeFloatLE(v,i*4));ix.forEach((v,i)=>bin.writeUInt16LE(v,96+i*2));const doc={asset:{version:'2.0'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0},indices:1,material:0}]}],materials:[{pbrMetallicRoughness:{baseColorFactor:[...color,1]}}],buffers:[{byteLength:168}],bufferViews:[{buffer:0,byteOffset:0,byteLength:96},{buffer:0,byteOffset:96,byteLength:72}],accessors:[{bufferView:0,componentType:5126,count:8,type:'VEC3',min:[-.5,-.5,-.5],max:[.5,.5,.5]},{bufferView:1,componentType:5123,count:36,type:'SCALAR'}]};const raw=Buffer.from(JSON.stringify(doc)),json=Buffer.alloc(Math.ceil(raw.length/4)*4,32);raw.copy(json);const out=Buffer.alloc(28+json.length+bin.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(json.length,12);out.writeUInt32LE(0x4e4f534a,16);json.copy(out,20);const offset=20+json.length;out.writeUInt32LE(bin.length,offset);out.writeUInt32LE(0x004e4942,offset+4);bin.copy(out,offset+8);return out;}
export const PLAYER_SOURCE=`using Axiom.Gameplay;
namespace Game;
public sealed class GameScript : Script {
 private bool jumpHeld;
 public override void OnStart() { Log.Info("Physics Playground: arrows or A/D to move; Space to jump. Stop restores the scene."); }
 public override void OnUpdate(double deltaSeconds) {
  var v=Entity.RigidBody.Velocity;
  var horizontal=Input.Axis("ArrowLeft","ArrowRight")+Input.Axis("KeyA","KeyD");
  var jump=Input.IsDown("Space");
  Entity.SetVelocity(new Vec3(horizontal*3.5,jump&&!jumpHeld&&System.Math.Abs(v.Y)<0.15?6:v.Y,0));
  jumpHeld=jump;
 }
}`;
export async function createDemos(root,{compile=true}={}){
 const w=new SceneWorkspace(new ProjectStore(root)),projects=[];
 const args=()=>({id:w.project.id,expectedSceneRevision:w.revision});
 async function asset(name,bytes){await w.run('asset.import',{...args(),name,base64:bytes.toString('base64')});return w.project.scene.assets.at(-1);}
 async function body(name,asset,position,half,dynamic=false,{dimension=2,trigger=false,restitution=0}={}){
  await w.run('scene.entity.create',{...args(),name});const id=w.project.scene.entities.at(-1).id;
  await w.run('scene.entity.update',{...args(),entityId:id,transform:{position,scale:half.map(v=>v*(asset.kind==='mesh'?2:1))}});
  await w.run('scene.component.add',{...args(),entityId:id,component:'Renderable',value:{kind:asset.kind,assetId:asset.id}});
  await w.run('scene.collider.set',{...args(),entityId:id,value:{dimension,shape:'box',halfExtents:half,trigger,layer:1,mask:0xffffffff}});
  if(dynamic)await w.run('scene.rigidBody.set',{...args(),entityId:id,value:{mass:1,velocity:[0,0,0],restitution,friction:0.6,gravityScale:1}});
  return id;
 }
 await w.run('project.create',{name:'Demo · 2D Physics Playground'});
 const floor=await asset('slate-platform.png',sprite([60,95,130])),player=await asset('mint-player.png',sprite([70,225,170])),crate=await asset('amber-crate.png',sprite([245,165,50])),sensor=await asset('violet-trigger.png',sprite([175,90,235],true));
 await body('Ground',floor,[0,-2,0],[7,.3,.5]);await body('Step 1',floor,[0,-1.05,0],[1,.3,.5]);await body('Step 2',floor,[3,0,0],[1,.3,.5]);await body('Trigger zone · inspect physics contacts',sensor,[5,-.5,-.05],[.6,1.2,.5],false,{trigger:true});
 const playerId=await body('Player · arrows / A-D / Space',player,[-4,-.8,0],[.4,.5,.5],true);
 await body('Crate A · push me',crate,[-1,1.2,0],[.4,.4,.5],true);await body('Crate B',crate,[2.8,2.5,0],[.4,.4,.5],true,{restitution:.15});
 await w.run('scene.camera.update',{...args(),camera:{projection:'orthographic',position:[0,1,12],target:[0,1,0],orthoHeight:8,fov:60}});
 if(compile){const result=await w.run('script.compile',{...args(),source:PLAYER_SOURCE,attachments:[playerId]});let job=result.job;const end=Date.now()+180000;while(['queued','running'].includes(job.status)&&Date.now()<end){await new Promise(r=>setTimeout(r,200));job=(await w.run('script.job.get',{id:w.project.id,jobId:job.id})).job;}if(job.status!=='completed')throw Error('Demo C# compilation failed: '+JSON.stringify(job));}
 await w.run('scene.save',args());projects.push({id:w.project.id,name:w.project.name,playerId});await w.run('project.close',args());
 await w.run('project.create',{name:'Demo · 3D Falling Blocks'});
 const stone=await asset('foundation.glb',cube([.15,.27,.4])),gold=await asset('gold-block.glb',cube([.95,.55,.12])),mint=await asset('mint-block.glb',cube([.15,.8,.6]));
 await body('Foundation',stone,[0,-1,0],[4,.3,3],false,{dimension:3});
 for(let i=0;i<6;i++)await body('Falling block '+(i+1),i%2?gold:mint,[(i%3-1)*1.5,1+Math.floor(i/3)*1.3,(i%2)*.35],[.45,.45,.45],true,{dimension:3,restitution:.1});
 await w.run('scene.camera.update',{...args(),camera:{projection:'perspective',position:[9,7,11],target:[0,1,0],orthoHeight:8,fov:50}});
 await w.run('scene.save',args());projects.push({id:w.project.id,name:w.project.name});return projects;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const root=resolve('.axiom/projects');console.log('Creating two new demo projects; existing projects are preserved.');console.log(JSON.stringify(await createDemos(root),null,2));console.log('Run npm run dev, then select a demo in Saved projects and Open.');}
