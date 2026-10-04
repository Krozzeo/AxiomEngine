import {add,sub,mul,dot,unit,length,basis,transform,modelMatrix,projectPoint,cameraRay,pickGeometry,frameCamera,axisQuaternion,quaternionMultiply,rotationDragAngle,orbitCamera} from './view-math.mjs';
const axes=[[1,0,0],[0,1,0],[0,0,1]],colors=['#ff7070','#75e894','#70acff'];
const ns='http://www.w3.org/2000/svg';
export function mountSceneTools({document,canvas,getRenderer,editor,reportError}){
 const $=id=>document.querySelector('#'+id),overlay=$('scene-overlay'),widget=$('orientation-widget');
 let selected=null,selection=[],tool='move',local=false,camera=null,projectId=null,preview=null,drag=null,navigation=null,last=0,drawAt=-Infinity,keys=new Set(),disposed=false;
 const boundsCache=new WeakMap();
 function corners(vertices){let bounds=boundsCache.get(vertices);if(!bounds){const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<vertices.length;i+=8)for(let j=0;j<3;j++){lo[j]=Math.min(lo[j],vertices[i+j]);hi[j]=Math.max(hi[j],vertices[i+j]);}bounds=[];for(let i=0;i<8;i++)bounds.push([0,1,2].map(j=>i&(1<<j)?hi[j]:lo[j]));boundsCache.set(vertices,bounds);}return bounds;}
 function data(){return getRenderer()?.interaction()??{scene:{entities:[]},draws:[],playing:false,view:'scene'};}
 function editable(){const d=data();return d.view==='scene'&&!d.playing&&!!d.projectId&&!editor.isBusy()&&selection.length<=1;}
 function entity(){return data().scene.entities.find(e=>e.id===selected);}
 function setCamera(c){camera=c;getRenderer()?.setEditorCamera(c);}
 function setTool(value){tool=value;for(const name of ['move','rotate','scale'])$('tool-'+name).classList.toggle('active',name===tool);}
 function point(event){const rect=canvas.getBoundingClientRect();return [(event.clientX-rect.left)*canvas.width/rect.width,(event.clientY-rect.top)*canvas.height/rect.height];}
 // Keep SVG hit targets stable across animation frames: replacing a hovered handle
 // makes browsers retarget the next pointerdown to the SVG root.
 const cursors=new Map();
 function beginNodes(){cursors.set(overlay,0);cursors.set(widget,0);}
 function finishNodes(){for(const [parent,count]of cursors)while(parent.children.length>count)parent.lastElementChild.remove();}
 function svg(parent,tag,attrs,text){const index=cursors.get(parent)??0;cursors.set(parent,index+1);let node=parent.children[index];if(node?.localName!==tag){const replacement=document.createElementNS(ns,tag);if(node)node.replaceWith(replacement);else parent.append(replacement);node=replacement;}for(const attribute of [...node.attributes])if(!Object.hasOwn(attrs,attribute.name))node.removeAttribute(attribute.name);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,String(value));if(node.textContent!==(text??''))node.textContent=text??'';return node;}
 function axisDirection(e,i){return local?unit(transform(modelMatrix({...e.transform,scale:[1,1,1]}),axes[i],0).slice(0,3)):axes[i];}
 function render(now=0){
  if(disposed)return;
  const d=data();if(d.projectId!==projectId){projectId=d.projectId;camera=structuredClone(d.scene.camera??{position:[0,0,6],target:[0,0,0],projection:'perspective',fov:60,orthoHeight:6});preview=null;drag=null;setCamera(camera);}
  if(!camera||!d.projectId){overlay.hidden=true;widget.hidden=true;overlay.style.display='none';widget.style.display='none';$('scene-toolbar').hidden=true;return;}
  if(navigation?.fly&&keys.size){const dt=Math.min((now-last)/1000,.05),b=basis(camera);let motion=[0,0,0];for(const [key,v]of [['KeyW',b.forward],['KeyS',mul(b.forward,-1)],['KeyD',b.right],['KeyA',mul(b.right,-1)],['KeyE',[0,1,0]],['KeyQ',[0,-1,0]]])if(keys.has(key))motion=add(motion,v);const shift=keys.has('ShiftLeft')?3:1,delta=mul(unit(motion),dt*navigation.speed*shift);setCamera({...camera,position:add(camera.position,delta),target:add(camera.target,delta)});}
  last=now;
  if(now-drawAt<33)return;drawAt=now;
  const visible=d.view==='scene';overlay.hidden=!visible;widget.hidden=!visible;overlay.style.display=visible?'block':'none';widget.style.display=visible?'block':'none';$('scene-toolbar').hidden=!visible;
  $('tool-projection').textContent=camera.projection==='orthographic'?'Ortho':'Persp';
  beginNodes();try{
  const rect=canvas.getBoundingClientRect(),parent=canvas.parentElement.getBoundingClientRect();Object.assign(overlay.style,{left:(rect.left-parent.left)+'px',top:(rect.top-parent.top)+'px',width:rect.width+'px',height:rect.height+'px'});overlay.setAttribute('viewBox',`0 0 ${canvas.width} ${canvas.height}`);
  const b=basis(camera);for(let i=0;i<3;i++)for(const sign of [-1,1]){const direction=mul(axes[i],sign),x=52+dot(direction,b.right)*35,y=52-dot(direction,b.up)*35;svg(widget,'line',{x1:52,y1:52,x2:x,y2:y,stroke:colors[i],'stroke-width':sign===1?3:1});svg(widget,'circle',{cx:x,cy:y,r:9,fill:'#142131',stroke:colors[i],'data-axis':i,'data-sign':sign,role:'button','aria-label':`${sign>0?'+':'-'}${'XYZ'[i]} view`,tabindex:0});svg(widget,'text',{x,y:y+4,fill:colors[i],'text-anchor':'middle','pointer-events':'none'},(sign<0?'-':'')+'XYZ'[i]);}
  if(!visible)return;
  for(const light of d.scene.entities.filter(e=>e.light)){const p=projectPoint(light.transform.position,camera,canvas.width,canvas.height);if(p)svg(overlay,'circle',{cx:p[0],cy:p[1],r:9,fill:'#ffd878',stroke:selection.includes(light.id)?'#fff':'#674e19','stroke-width':2,'data-entity':light.id,'aria-label':'Light '+light.name});}
  for(const id of selection.filter(id=>id!==selected)){const points=d.draws.filter(draw=>draw.entityId===id).flatMap(draw=>corners(draw.vertices).map(c=>projectPoint(transform(draw.model??modelMatrix(draw.transform),c).slice(0,3),camera,canvas.width,canvas.height))).filter(Boolean);if(points.length){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);svg(overlay,'rect',{x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys),fill:'none',stroke:'#ffce62','stroke-width':2,'data-selection':id,'pointer-events':'none'});}}
  if(!selected)return;
  const e=entity();if(!e)return;
  const active=preview?{...e,transform:preview}:e,position=active.transform.position,center=projectPoint(position,camera,canvas.width,canvas.height);if(!center)return;
  // Projected bounds outline identifies the selected object without changing materials.
  const draws=d.draws.filter(draw=>draw.entityId===selected),points=[];
  for(const draw of draws){const m=preview?modelMatrix(preview):(draw.model??modelMatrix(draw.transform));for(const corner of corners(draw.vertices)){const p=projectPoint(transform(m,corner).slice(0,3),camera,canvas.width,canvas.height);if(p&&p[2]>=0&&p[2]<=1)points.push(p);}}
  if(points.length){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);svg(overlay,'rect',{x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys),fill:'none',stroke:'#ffce62','stroke-width':2,'data-selection':selected,'pointer-events':'none'});}
  if(!editable())return;
  const distance=length(sub(camera.position,position)),extent=camera.projection==='orthographic'?camera.orthoHeight*.15:distance*.15;
  for(let i=0;i<3;i++){
   const direction=axisDirection(active,i),end=projectPoint(add(position,mul(direction,extent)),camera,canvas.width,canvas.height);if(!end)continue;
   if(tool==='rotate'){
    const u=unit(crossForAxis(direction)),v=unit(crossForAxis(direction,u)),pts=[];for(let j=0;j<=64;j++){const a=j*Math.PI/32,p=projectPoint(add(position,mul(add(mul(u,Math.cos(a)),mul(v,Math.sin(a))),extent*.75)),camera,canvas.width,canvas.height);if(p)pts.push(p.slice(0,2).join(','));}
    svg(overlay,'polyline',{points:pts.join(' '),fill:'none',stroke:colors[i],'stroke-width':5,'data-handle':i,'aria-label':'Rotate '+'XYZ'[i]});
   }else{svg(overlay,'line',{x1:center[0],y1:center[1],x2:end[0],y2:end[1],stroke:colors[i],'stroke-width':5,'data-handle':i});svg(overlay,tool==='scale'?'rect':'circle',tool==='scale'?{x:end[0]-6,y:end[1]-6,width:12,height:12,fill:colors[i],'data-handle':i}:{cx:end[0],cy:end[1],r:7,fill:colors[i],'data-handle':i});}
  }
  if(tool==='scale')svg(overlay,'rect',{x:center[0]-6,y:center[1]-6,width:12,height:12,fill:'#ffce62','data-handle':'all'});
 }finally{finishNodes();}
 }
 function crossForAxis(a,u){const v=u??(Math.abs(a[1])<.9?[0,1,0]:[1,0,0]);return [a[1]*v[2]-a[2]*v[1],a[2]*v[0]-a[0]*v[2],a[0]*v[1]-a[1]*v[0]];}
 function cancel(){drag=null;preview=null;getRenderer()?.previewTransform(null);}
 function down(event){if(data().view!=='scene')return;const p=point(event),e=entity();
  if(event.button===1||event.button===2||event.altKey){event.preventDefault();canvas.focus();navigation={start:p,moved:false,x:event.clientX,y:event.clientY,button:event.button,orbit:event.altKey&&event.button===0&&camera.projection!=='orthographic',fly:event.button===2&&!event.altKey&&camera.projection!=='orthographic',zoom:event.altKey&&event.button===2,speed:Math.max(1,length(sub(camera.position,camera.target))*.5)};canvas.setPointerCapture(event.pointerId);return;}
  if(event.button!==0)return;
  // SVG may retarget pointerdown to the root while animated geometry is updating.
  // Resolve the actual painted handle at the same logical canvas coordinates.
  let handle=event.target.closest?.('[data-handle]')?.getAttribute('data-handle');
  if(handle===null||handle===undefined){const hitPoint=new DOMPoint(p[0],p[1]);for(const node of [...overlay.querySelectorAll('[data-handle]')].reverse()){if((node.getAttribute('fill')!=='none'&&node.isPointInFill?.(hitPoint))||node.isPointInStroke?.(hitPoint)){handle=node.getAttribute('data-handle');break;}}}
  if(handle!==null&&handle!==undefined&&e&&editable()){
   const origin=structuredClone(e.transform),center=projectPoint(origin.position,camera,canvas.width,canvas.height),axis=handle==='all'?null:axisDirection(e,Number(handle)),distance=length(sub(camera.position,origin.position)),worldPerPixel=camera.projection==='orthographic'?camera.orthoHeight/canvas.height:2*distance*Math.tan(camera.fov*Math.PI/360)/canvas.height;
   const end=axis?projectPoint(add(origin.position,axis),camera,canvas.width,canvas.height):null;
   drag={id:e.id,revision:dRevision(),origin,start:p,axis,index:handle,center,screenAxis:end?sub(end.slice(0,2),center.slice(0,2)):[1,0],worldPerPixel,tool,previous:p,angle:0};overlay.setPointerCapture(event.pointerId);event.preventDefault();return;
  }
  if(!editor.isBusy()){selected=event.target.closest?.('[data-entity]')?.getAttribute('data-entity')??pickGeometry(cameraRay(...p,camera,canvas.width,canvas.height),data().draws);editor.selectEntity(selected,event.altKey||event.ctrlKey||event.metaKey);}
 }
 function dRevision(){return data().sceneRevision;}
 function move(event){
  if(navigation){const dx=event.clientX-navigation.x,dy=event.clientY-navigation.y;navigation.moved ||= Math.hypot(...sub(point(event),navigation.start))>4;navigation.x=event.clientX;navigation.y=event.clientY;const b=basis(camera),distance=Math.max(.1,length(sub(camera.position,camera.target)));
   if(navigation.zoom){const v=mul(b.forward,-dy*distance*.01);setCamera({...camera,position:add(camera.position,v)});}
   else if(navigation.orbit||(navigation.fly&&!['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE'].some(k=>keys.has(k)))){if(navigation.moved)setCamera(orbitCamera(camera,dx,dy));}
   else if(navigation.fly){const offset=navigation.orbit?sub(camera.position,camera.target):sub(camera.target,camera.position),yaw=-dx*.005,pitch=dy*.005*(navigation.fly?-1:1);const turn=quaternionMultiply(axisQuaternion([0,1,0],yaw),axisQuaternion(b.right,pitch)),rotated=transform(modelMatrix({position:[0,0,0],rotation:turn,scale:[1,1,1]}),offset,0).slice(0,3);setCamera(navigation.orbit?{...camera,position:add(camera.target,rotated)}:{...camera,target:add(camera.position,rotated)});}
   else{const factor=(camera.projection==='orthographic'?camera.orthoHeight:distance)*.002,delta=add(mul(b.right,-dx*factor),mul(b.up,dy*factor));setCamera({...camera,position:add(camera.position,delta),target:add(camera.target,delta)});}return;
  }
  if(!drag)return;if(drag.revision!==dRevision()||!editable()){cancel();return;}const p=point(event),delta=sub(p,drag.start),t=structuredClone(drag.origin),axisLength=Math.hypot(...drag.screenAxis);let amount;
  if(drag.tool==='rotate'){drag.angle+=rotationDragAngle(drag.previous,p,drag.origin.position,drag.axis,camera,canvas.width,canvas.height);drag.previous=p;t.rotation=quaternionMultiply(axisQuaternion(drag.axis,drag.angle),t.rotation);}
  else{amount=axisLength>2?dot(delta,drag.screenAxis)/(axisLength*axisLength):(-delta[1])*drag.worldPerPixel;if(drag.tool==='move')t.position=add(t.position,mul(drag.axis,amount));else{const factor=Math.max(.01,1+(drag.index==='all'?(delta[0]-delta[1])*.01:amount));t.scale=t.scale.map((v,i)=>drag.index==='all'||i===Number(drag.index)?v*factor:v);}}
  if([...t.position,...t.scale].some(v=>Math.abs(v)>1000000))return;preview=t;getRenderer()?.previewTransform({entityId:drag.id,transform:t});
 }
 async function up(event){if(navigation?.button===0&&!navigation.moved&&event?.altKey){const p=point(event),id=event.target.closest?.('[data-entity]')?.getAttribute('data-entity')??pickGeometry(cameraRay(...p,camera,canvas.width,canvas.height),data().draws);editor.selectEntity(id,true);}navigation=null;keys.clear();if(!drag)return;const operation=drag,value=preview;cancel();if(value&&operation.revision===dRevision()&&editable())await editor.transformEntity(operation.id,value);}
 function wheel(event){if(data().view!=='scene')return;event.preventDefault();if(navigation?.fly){navigation.speed=Math.max(.1,Math.min(10000,navigation.speed*Math.exp(-event.deltaY*.002)));return;}const factor=Math.exp(Math.max(-1,Math.min(1,event.deltaY*.001))),b=basis(camera);if(camera.projection==='orthographic')setCamera({...camera,orthoHeight:Math.max(.01,Math.min(1000000,camera.orthoHeight*factor))});else setCamera({...camera,position:add(camera.target,mul(b.forward,-Math.max(.05,length(sub(camera.position,camera.target))*factor)))});}
 function keydown(event){if(/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName??''))return;if(event.code==='Escape'){cancel();navigation=null;keys.clear();return;}if(event.ctrlKey||event.metaKey||event.altKey)return;if(data().view!=='scene')return;if(navigation?.fly){keys.add(event.code);event.preventDefault();return;}if(event.code==='KeyF'&&entity()){setCamera(frameCamera(camera,entity()));event.preventDefault();}else if(editable()&&['KeyW','KeyE','KeyR'].includes(event.code)){setTool({KeyW:'move',KeyE:'rotate',KeyR:'scale'}[event.code]);event.preventDefault();}}
 for(const node of [canvas,overlay]){node.addEventListener('pointerdown',down);node.addEventListener('pointermove',move);node.addEventListener('pointerup',up);node.addEventListener('pointercancel',()=>{cancel();navigation=null;});node.addEventListener('wheel',wheel,{passive:false});node.addEventListener('contextmenu',e=>e.preventDefault());}
 for(const name of ['move','rotate','scale'])$('tool-'+name).addEventListener('click',()=>setTool(name));$('tool-space').addEventListener('click',()=>{local=!local;$('tool-space').textContent=local?'Local':'World';});
 $('tool-projection').addEventListener('click',()=>setCamera({...camera,projection:camera.projection==='orthographic'?'perspective':'orthographic'}));
 function align(event){const node=event.target.closest?.('[data-axis]');if(!node)return;const axis=axes[Number(node.getAttribute('data-axis'))],sign=Number(node.getAttribute('data-sign')),distance=Math.max(1,length(sub(camera.position,camera.target)));setCamera({...camera,position:add(camera.target,mul(axis,sign*distance)),up:axis[1]?[0,0,-sign]:[0,1,0]});}
 widget.addEventListener('click',align);widget.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();align(e);}});
 const keyup=e=>keys.delete(e.code),blur=()=>{keys.clear();navigation=null;cancel();};
 globalThis.addEventListener('keydown',keydown);globalThis.addEventListener('keyup',keyup);globalThis.addEventListener('blur',blur);
 setTool(tool);let animation;function tick(now){render(now);if(!disposed)animation=requestAnimationFrame(tick);}animation=requestAnimationFrame(tick);
 return {select(ids){selection=Array.isArray(ids)?ids:(ids?[ids]:[]);selected=selection.at(-1)??null;cancel();},dispose(){disposed=true;cancelAnimationFrame(animation);globalThis.removeEventListener('keydown',keydown);globalThis.removeEventListener('keyup',keyup);globalThis.removeEventListener('blur',blur);},get camera(){return structuredClone(camera);}};
}
