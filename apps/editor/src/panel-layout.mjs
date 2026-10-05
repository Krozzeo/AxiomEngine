import {mountDockLayout} from './dock-layout.mjs';
export function mountPanelLayout({document,save,isBusy,onView}){
 const workspace=document.querySelector('#editor-workspace');let layout={leftWidth:220,rightWidth:290,bottomHeight:190},drag=null;
 const limits={leftWidth:[150,600],rightWidth:[220,700],bottomHeight:[120,650]};
 const docking=mountDockLayout({document,isBusy,onView,save:docks=>{layout.docks=docks;return save({...layout});}});
 const clamp=(key,value)=>{const available=key==='bottomHeight'?(workspace.clientHeight??900)-195:(workspace.clientWidth??1700)-(key==='leftWidth'?layout.rightWidth:layout.leftWidth)-300;return Math.min(Math.max(limits[key][0],Math.min(limits[key][1],available)),Math.max(limits[key][0],value));};
 function paint(){for(const [key,css]of [['leftWidth','left-width'],['rightWidth','right-width'],['bottomHeight','bottom-height']])workspace.style.setProperty('--'+css,layout[key]+'px');const canvas=document.querySelector('#viewport'),parent=canvas?.parentElement;if(parent?.clientHeight>0){canvas.style.width=Math.min(960,parent.clientWidth,parent.clientHeight*canvas.width/canvas.height)+'px';canvas.style.height='auto';}}
 for(const [id,key,axis,sign]of [['left-resizer','leftWidth','clientX',1],['right-resizer','rightWidth','clientX',-1],['bottom-resizer','bottomHeight','clientY',-1]]){
  const node=document.querySelector('#'+id);if(!node?.setPointerCapture)continue;
  node.addEventListener('pointerdown',event=>{if(isBusy())return;event.preventDefault();drag={key,start:event[axis],value:layout[key],pointerId:event.pointerId};node.setPointerCapture(event.pointerId);});
  node.addEventListener('pointermove',event=>{if(drag?.key!==key)return;layout[key]=clamp(key,drag.value+sign*(event[axis]-drag.start));paint();});
  node.addEventListener('pointerup',()=>{if(drag?.key!==key)return;drag=null;void save({...layout});});
  node.addEventListener('pointercancel',()=>{if(drag){layout[key]=drag.value;drag=null;paint();}});
  node.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)||isBusy())return;event.preventDefault();layout[key]=clamp(key,layout[key]+(['ArrowRight','ArrowDown'].includes(event.code)?10:-10)*sign);paint();void save({...layout});});
 }
 globalThis.addEventListener?.('resize',()=>{if(workspace.style?.setProperty)paint();});
 return {activateView:docking.activateView??(()=>{}),set(value){if(drag)return;layout={leftWidth:220,rightWidth:290,bottomHeight:190,...value};docking.set(layout.docks);if(workspace.style?.setProperty)paint();}};
}
