import {matrixMultiply,transform} from '../renderer/render-math.mjs';
const check=value=>{if(value!==0)throw Error('AX_ANIMATION_0001: rejected animation resource/control');};
export function animationHost(api,world){
 let items=[],playing=false;
 function configure(scene,assets){items=[];for(const e of scene.entities.filter(e=>e.animator)){
  const resource=assets.get(e.renderable.assetId)?.animation,a=e.animator,slot=items.length;if(!resource?.clips.length||slot>=16)throw Error('AX_ANIMATION_0001: missing or excessive animation resources');
  check(api.axiom_anim_create(world,slot));
  for(const [i,n]of resource.nodes.entries()){check(api.axiom_anim_node(world,slot,n.parent,...n.translation,...n.rotation,...n.scale));if(n.matrix)for(let j=0;j<16;j++)check(api.axiom_anim_bind(world,slot,i,j,n.matrix[j]));}
  for(const [c,clip]of resource.clips.entries())for(const t of clip.tracks){const index=api.axiom_anim_track(world,slot,c,t.node,['translation','rotation','scale'].indexOf(t.path),t.interpolation==='STEP'?1:0);if(index===0xffffffff)throw Error('AX_ANIMATION_0001: invalid track');for(let k=0;k<t.times.length;k++)check(api.axiom_anim_key(world,slot,c,index,t.times[k],...t.values[k],...(t.values[k].length===3?[0]:[])));}
  for(const s of a.states){const c=resource.clips.findIndex(c=>c.name===s.clip);check(api.axiom_anim_state(world,slot,c,s.loop?1:0,s.speed));}
  for(const t of a.transitions)check(api.axiom_anim_transition(world,slot,a.states.findIndex(s=>s.name===t.source),a.states.findIndex(s=>s.name===t.target),a.parameters.findIndex(p=>p.name===t.parameter),['gt','lt','eq'].indexOf(t.comparison),t.threshold,t.duration));
  check(api.axiom_anim_control(world,slot,0,a.states.findIndex(s=>s.name===a.initialState),0));check(api.axiom_anim_control(world,slot,3,0,a.speed));check(api.axiom_anim_control(world,slot,1,0,a.autoplay?0:1));
  for(const [i,p]of a.parameters.entries())check(api.axiom_anim_control(world,slot,2,i,p.value));
  items.push({entityId:e.id,slot,a,resource,matrices:[]});
 }
 }
 function status(){return items.map(({entityId,slot,a,resource})=>{const state=a.states[api.axiom_anim_status(world,slot,0)],time=api.axiom_anim_status(world,slot,1),previous=api.axiom_anim_status(world,slot,3),paused=!!api.axiom_anim_status(world,slot,2),speed=api.axiom_anim_status(world,slot,5),duration=resource.clips.find(c=>c.name===state.clip).duration;return {entityId,state:state.name,currentAnimation:state.clip,time,loop:state.loop,speed,paused,transition:previous>=0?{source:a.states[previous].name,target:state.name,weight:api.axiom_anim_status(world,slot,4)}:null,whyAnimationNotPlaying:!playing?'Play is stopped':paused?'Animator paused':speed===0?'Animator speed is zero':!state.loop&&time>=duration?'Nonlooping clip completed':null,parameters:a.parameters.map(p=>({...p}))};});}
 function control({entityId,action,name,value,duration=0}){if(!playing)throw Error('AX_ANIMATION_0001: Play is required');const item=items.find(i=>i.entityId===entityId);if(!item)throw Error('AX_ANIMATION_0001: Animator not found');const {slot,a}=item;if(action==='pause'||action==='resume')check(api.axiom_anim_control(world,slot,1,0,action==='pause'?1:0));else if(action==='state'){const index=a.states.findIndex(s=>s.name===name);if(index<0)throw Error('AX_ANIMATION_0001: Unknown state');check(api.axiom_anim_control(world,slot,0,index,duration));}else if(action==='parameter'){const index=a.parameters.findIndex(p=>p.name===name);if(index<0||!Number.isFinite(value))throw Error('AX_ANIMATION_0001: Unknown parameter/value');check(api.axiom_anim_control(world,slot,2,index,value));a.parameters[index].value=value;}else throw Error('AX_ANIMATION_0001: Unknown control');return status().find(i=>i.entityId===entityId);}
 function step(delta,active,draws){playing=active;for(const i of items){check(api.axiom_anim_tick(world,i.slot,active?delta:0,active?1:0));i.matrices=i.resource.nodes.map((_,n)=>Float32Array.from({length:16},(_,c)=>api.axiom_anim_matrix(world,i.slot,n,c)));}
  for(const i of items)if(i.matrices.some(m=>Array.from(m).some(v=>!Number.isFinite(v)||Math.abs(v)>1e8)))throw Error('AX_ANIMATION_0001: Animated transform exceeds supported range');
  for(const draw of draws){const item=items.find(i=>i.entityId===draw.entityId);if(!item||!draw.skinData)continue;const s=draw.skinData,palette=s.skin===null?[item.matrices[s.node]]:item.resource.skins[s.skin].joints.map((n,j)=>matrixMultiply(item.matrices[n],item.resource.skins[s.skin].inverseBinds[j]));draw.skinPalette=Float32Array.from(palette.flatMap(m=>Array.from(m)));draw.skinSource??=new Float32Array(s.vertices);draw.skinInfluences??=new Float32Array(s.influences);draw.vertices=new Float32Array(s.vertices.length);
   for(let n=0;n<s.vertices.length/8;n++){const p=[0,0,0],normal=[0,0,0];for(let j=0;j<4;j++){const weight=s.influences[n*8+4+j];if(!weight)continue;const m=palette[s.influences[n*8+j]],v=transform(m,s.vertices.slice(n*8,n*8+3));const a=[m[0],m[1],m[2]],b=[m[4],m[5],m[6]],c=[m[8],m[9],m[10]],cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],A=cross(b,c),B=cross(c,a),C=cross(a,b),det=a.reduce((v,x,k)=>v+x*A[k],0),source=s.vertices.slice(n*8+3,n*8+6);for(let k=0;k<3;k++){p[k]+=v[k]*weight;normal[k]+=(A[k]*source[0]+B[k]*source[1]+C[k]*source[2])/det*weight;}}
    const len=Math.hypot(...normal)||1;draw.vertices.set([...p,...normal.map(v=>v/len),...s.vertices.slice(n*8+6,n*8+8)],n*8);
   }
  }
  return status();
 }
 return {configure,step,status,control};
}
