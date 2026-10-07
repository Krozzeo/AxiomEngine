// Bounded, DOM-free decisions shared by WebGPU, Null and acceptance tests.
import {cameraMatrix,matrixMultiply,modelMatrix,transform,unit} from './render-math.mjs';
export const renderingDefaults=Object.freeze({renderScale:1,tier:'medium',culling:'gpu',exposure:1,toneMapping:'aces',environment:[.12,.16,.24],shadows:true,shadowSize:20,bloom:.15,fxaa:true});
export const materialDefaults=Object.freeze({baseColor:[1,1,1,1],metallic:0,roughness:.5,emissive:[0,0,0],alphaMode:'opaque',alphaCutoff:.5,unlit:false,castShadow:true});
export const tierBudgets=Object.freeze({low:{lights:8,shadow:512,bloom:false},medium:{lights:32,shadow:1024,bloom:true},high:{lights:64,shadow:2048,bloom:true}});
const boundsCache=new WeakMap();
export function bounds(vertices){let b=boundsCache.get(vertices);if(b)return b;b={minimum:[Infinity,Infinity,Infinity],maximum:[-Infinity,-Infinity,-Infinity]};for(let i=0;i<vertices.length;i+=8)for(let j=0;j<3;j++){b.minimum[j]=Math.min(b.minimum[j],vertices[i+j]);b.maximum[j]=Math.max(b.maximum[j],vertices[i+j]);}boundsCache.set(vertices,b);return b;}
export function visibleBounds(b,mvp){const corners=[];for(let k=0;k<8;k++)corners.push(transform(mvp,[0,1,2].map(j=>(k&(1<<j))?b.maximum[j]:b.minimum[j])));return ![v=>v[0]<-v[3],v=>v[0]>v[3],v=>v[1]<-v[3],v=>v[1]>v[3],v=>v[2]<0,v=>v[2]>v[3]].some(test=>corners.every(test));}
export function renderPlan(scene,draws,camera,aspect,assets=new Map(),capabilities={gpuCulling:true}){
 if(draws.length>1024)throw Error('AX_RENDERER_0005: more than 1024 instances');
 const settings={...renderingDefaults,...scene.rendering},budget=tierBudgets[settings.tier],fallbacks=[];
 if(settings.culling==='gpu'&&!capabilities.gpuCulling){settings.culling='cpu';fallbacks.push('GPU culling unavailable; CPU bounds culling selected');}
 if(settings.bloom&&!budget.bloom){settings.bloom=0;fallbacks.push('Bloom disabled by low tier budget');}
 const byId=new Map(scene.entities.map(e=>[e.id,e])),vp=cameraMatrix(camera,aspect),items=[];
 for(const draw of draws){const entity=byId.get(draw.entityId);if(!entity)continue;const model=draw.model??modelMatrix(entity.transform),distance=Math.hypot(...camera.position.map((v,i)=>v-model[12+i]));let assetId=entity.renderable.assetId,lod=0,source=draw;
  for(const [i,level]of (entity.lod?.levels??[]).entries())if(distance>=level.distance){assetId=level.assetId;lod=i+1;}
  if(lod){const asset=assets.get(assetId),primitive=asset?.primitives?.[draw.primitiveIndex??0];if(primitive)source={...draw,...primitive,vertices:primitive.typedVertices??=new Float32Array(primitive.vertices)};else{assetId=entity.renderable.assetId;lod=0;fallbacks.push('Missing LOD asset: '+entity.id);}}
  const b=bounds(source.vertices),mvp=matrixMultiply(vp,model),material={...materialDefaults,...source.material,baseColor:source.color??materialDefaults.baseColor,unlit:!!source.unlit,...entity.material};
  const visible=visibleBounds(b,mvp),key=(draw.skinPalette?draw.entityId+':':'')+assetId+':'+(draw.primitiveIndex??0)+':'+material.alphaMode;
  items.push({...source,model,mvp,bounds:b,material,assetId,lod,distance,visible,key});
 }
 const opaque=items.filter(i=>i.material.alphaMode!=='blend').sort((a,b)=>a.key.localeCompare(b.key)),blend=items.filter(i=>i.material.alphaMode==='blend').sort((a,b)=>b.distance-a.distance),ordered=[...opaque,...blend],batches=[];
 for(let i=0;i<ordered.length;i++){const item=ordered[i],last=batches.at(-1);if(last&&last.key===item.key&&item.material.alphaMode!=='blend')last.count++;else batches.push({key:item.key,first:i,count:1,vertices:item.vertices,texture:item.texture,alphaMode:item.material.alphaMode});}
 if(items.reduce((n,i)=>n+i.vertices.length/8,0)>300000)throw Error('AX_RENDERER_0005: selected LOD exceeds 300000 vertices');
 const allLights=scene.entities.filter(e=>e.light),lights=allLights.slice(0,budget.lights).map(e=>({...e.light,entityId:e.id,position:e.transform.position,direction:unit(transform(modelMatrix({...e.transform,scale:[1,1,1]}),e.light.direction,0).slice(0,3))}));
 if(allLights.length>lights.length)fallbacks.push(`${allLights.length-lights.length} lights omitted by ${settings.tier} tier budget`);
 const shadowIndex=settings.shadows?lights.findIndex(l=>l.shadow&&l.kind!=='point'):-1;
 if(settings.shadows&&lights.some(l=>l.shadow&&l.kind==='point'))fallbacks.push('Point light shadows unavailable; direct light remains active');
 return {settings,budget,items:ordered,batches,lights,shadowIndex,fallbacks:[...new Set(fallbacks)],stats:{instances:items.length,cpuVisible:items.filter(i=>i.visible).length,culled:settings.culling==='none'?0:items.filter(i=>!i.visible).length,batches:batches.length,vertices:items.reduce((n,i)=>n+i.vertices.length/8,0),lodInstances:items.filter(i=>i.lod>0).length,lights:lights.length,culling:settings.culling,lighting:settings.tier==='low'?'forward':'forward+',pixels:'unproven'}};
}
