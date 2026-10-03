import {PNG} from 'pngjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {createDemos,cube} from './create-projects.mjs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export async function createM8Demos(root){
 const w=new SceneWorkspace(new ProjectStore(root)),result=[];
 const args=extra=>({id:w.project.id,expectedSceneRevision:w.revision,...extra});
 const png=new PNG({width:32,height:32});for(let i=0;i<png.data.length;i+=4)png.data.set([90,210,240,255],i);const bytes=PNG.sync.write(png);
 async function importSprite(name){await w.run('asset.import',args({name,base64:bytes.toString('base64')}));return w.project.scene.assets.at(-1);}
 async function add(name,position,asset,extra={}){await w.run('scene.entity.create',args({name}));const id=w.project.scene.entities.at(-1).id;await w.run('scene.entity.update',args({entityId:id,transform:{position,...extra}}));if(asset)await w.run('scene.component.add',args({entityId:id,component:'Renderable',value:{kind:asset.kind,assetId:asset.id}}));return id;}
 await w.run('project.create',{name:'Demo · M8 Scene Workshop'});
 for(const [name,color]of [['blue-block.glb',[.2,.4,.7]],['gold-block.glb',[.95,.6,.15]],['mint-block.glb',[.15,.8,.6]]])await w.run('asset.import',args({name,base64:cube(color).toString('base64')}));
 const assets=w.project.scene.assets;
 await add('Move me · W · drag XYZ',[-2,0,0],assets[0]);await add('Rotate me · E · drag rings',[0,0,0],assets[1]);await add('Scale me · R · drag XYZ',[2,0,0],assets[2]);await add('Depth reference',[0,0,-3],assets[0]);const sprite=await importSprite('cyan-marker.png');await add('2D marker · select in Scene',[0,2,0],sprite,{scale:[.4,.4,.4]});
 await w.run('scene.camera.update',args({camera:{projection:'perspective',position:[7,5,10],target:[0,0,0],fov:50,orthoHeight:8}}));await w.run('scene.save',args());result.push({id:w.project.id,name:w.project.name});await w.run('project.close',args());
 await w.run('project.create',{name:'Demo · M8 Diagnostic Lab'});const marker=await importSprite('lab-marker.png');
 await add('Invisible · no Renderable · whyNotRendered',[-3,0,0],null);
 await add('Outside camera · whyNotRendered',[1000,0,0],marker);
 const a=await add('Mask 0 · whyNotColliding',[-1,0,0],marker,{scale:[.4,.4,.4]}),b=await add('Overlap partner',[ -.7,0,0],marker,{scale:[.4,.4,.4]});
 for(const [id,mask]of [[a,0],[b,4294967295]])await w.run('scene.collider.set',args({entityId:id,value:{shape:'box',dimension:2,halfExtents:[.4,.4,.4],trigger:false,layer:1,mask}}));
 await add('No Collider · whyNotColliding',[2,0,0],marker,{scale:[.4,.4,.4]});
 await w.run('scene.entity.create',args({name:'No script attached · whyScriptNotRunning'}));
 const spare=new PNG({width:1,height:1});spare.data.set([250,150,60,255]);await w.run('asset.import',args({name:'unused-asset.png',base64:PNG.sync.write(spare).toString('base64')}));
 await w.run('scene.camera.update',args({camera:{projection:'orthographic',position:[0,0,10],target:[0,0,0],fov:60,orthoHeight:6}}));await w.run('scene.save',args());result.push({id:w.project.id,name:w.project.name});
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const root=resolve('.axiom/projects');console.log(JSON.stringify([...await createDemos(root,{onProgress:message=>console.log(message)}),...await createM8Demos(root)],null,2));console.log('Open M8 Scene Workshop or M8 Diagnostic Lab. The two M7 physics demos are also included.');}
