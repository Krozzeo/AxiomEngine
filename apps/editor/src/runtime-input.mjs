// One bounded snapshot per simulation frame, shared by every C# lifecycle phase.
export function createRuntimeInput(){
 const pointers=new Map(),terminal=new Map(),buttons=new Set(),down=new Set(),up=new Set();let position=[0,0],scroll=[0,0];
 const location=(event,canvas)=>{const r=canvas.getBoundingClientRect();return [(event.clientX-r.left)*canvas.width/r.width,(r.bottom-event.clientY)*canvas.height/r.height];};
 return {
  key(event){(event.type==='keydown'?down:up).add(event.code);},
  pointer(event,canvas){if(!canvas)return;position=location(event,canvas);const end=/up|cancel/.test(event.type),touch=event.pointerType==='touch';if(touch){if(!pointers.has(event.pointerId)&&pointers.size>=10)return;const old=pointers.get(event.pointerId);const next={fingerId:event.pointerId,position:[...position],deltaPosition:old?position.map((v,i)=>v-old.position[i]):[0,0],phase:event.type==='pointercancel'?'Canceled':end?'Ended':event.type==='pointerdown'?'Began':'Moved',pressure:Number.isFinite(event.pressure)?event.pressure:0};if(end&&old?.phase==='Began')terminal.set(event.pointerId,next);else pointers.set(event.pointerId,next);}else{const name='Mouse'+event.button;if(event.type==='pointerdown'){buttons.add(name);down.add(name);}if(end){buttons.delete(name);up.add(name);}}},
  wheel(event){scroll[0]+=event.deltaX;scroll[1]-=event.deltaY;},
  clear(){pointers.clear();terminal.clear();buttons.clear();down.clear();up.clear();position=[0,0];scroll=[0,0];},
  sample(navigatorObject=globalThis.navigator){const pads=Array.from(navigatorObject?.getGamepads?.()??[]).filter(p=>p?.connected).slice(0,4).map(p=>({index:p.index,name:String(p.id).slice(0,128),axes:Array.from(p.axes).slice(0,16).map(v=>Number.isFinite(v)?Math.max(-1,Math.min(1,v)):0),buttons:Array.from(p.buttons).slice(0,32).map(v=>Number.isFinite(v.value)?Math.max(0,Math.min(1,v.value)):0)}));const snapshot={down:[...down],up:[...up],mousePosition:[...position],mouseScrollDelta:[...scroll],buttons:[...buttons],touches:[...pointers.values()].map(p=>structuredClone(p)),gamepads:pads};scroll=[0,0];down.clear();up.clear();for(const[id,p]of pointers){if(['Ended','Canceled'].includes(p.phase))pointers.delete(id);else if(terminal.has(id)){pointers.set(id,terminal.get(id));terminal.delete(id);}else {p.phase='Stationary';p.deltaPosition=[0,0];}}return snapshot;}
 };
}
