export const dockDefaults={hierarchy:'left',inspector:'right',project:'bottom',console:'bottom',diagnostics:'bottom',profiler:'bottom'};
const positions=['left','right','top','bottom'];
// Panels keep their actual DOM nodes and handlers. There is one renderer/lease,
// even when controls live in another same-origin window.
export function createEditorDocument(root) {
  if(!root.defaultView)return root;
  const documents=new Set([root]),listeners=[];
  return new Proxy(root,{get(target,key){
    if(key==='attachWindow')return win=>{documents.add(win.document);for(const [type,fn,options]of listeners)win.document.addEventListener(type,fn,options);return ()=>documents.delete(win.document);};
    if(key==='querySelector')return selector=>{for(const doc of documents){const node=doc.querySelector(selector);if(node)return node;}return null;};
    if(key==='querySelectorAll')return selector=>[...documents].flatMap(doc=>[...doc.querySelectorAll(selector)]);
    if(key==='addEventListener')return (type,fn,options)=>{listeners.push([type,fn,options]);for(const doc of documents)doc.addEventListener(type,fn,options);};
    const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
  }});
}
export function mountDockLayout({document,save,isBusy}) {
  if(!document.defaultView)return {set(){},value:()=>undefined};
  const workspace=document.querySelector('#editor-workspace'),center=document.querySelector('.center');
  const nodes={hierarchy:document.querySelector('.hierarchy'),inspector:document.querySelector('.inspector'),...Object.fromEntries(['project','console','diagnostics','profiler'].map(id=>[id,document.querySelector('#'+id+'-content')]))};
  const originalBottom=document.querySelector('.console'),slots={},tabs={},windows=new Map();let layout={...dockDefaults},applying=false;
  workspace.classList.add('docked');
  for(const position of positions){const slot=document.createElement('section');slot.className='dock-slot dock-'+position;slot.dataset.dock=position;const nav=document.createElement('nav');nav.className='tabs dock-tabs';const body=document.createElement('div');body.className='dock-body';slot.append(nav,body);workspace.append(slot);slots[position]={slot,nav,body};slot.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('application/axiom-panel'))e.preventDefault();});slot.addEventListener('drop',e=>{const id=e.dataTransfer.getData('application/axiom-panel');if(!(id in nodes)||isBusy())return;e.preventDefault();place(id,position);persist();});}
  const resizer=document.querySelector('#bottom-resizer');slots.bottom.slot.prepend(resizer);
  for(const [id,node]of Object.entries(nodes)){
    const tab=document.querySelector('#'+id+'-tab')??document.createElement('button');tab.id=id+'-tab';if(!tab.textContent)tab.textContent=id==='hierarchy'?'Hierarchy':'Inspector';tab.draggable=true;tab.dataset.panel=id;tab.title='Drag to a dock, or use panel options';tab.addEventListener('dragstart',e=>e.dataTransfer.setData('application/axiom-panel',id));tab.addEventListener('click',()=>activate(id));tabs[id]=tab;node.classList.add('dock-panel');
    const controls=document.createElement('div');controls.className='dock-panel-controls';const select=document.createElement('select');select.setAttribute('aria-label','Dock '+id);for(const p of positions){const option=document.createElement('option');option.value=p;option.textContent='Dock '+p;select.append(option);}select.value=layout[id];select.addEventListener('change',()=>{if(isBusy()){select.value=layout[id];return;}place(id,select.value);persist();});const detach=document.createElement('button');detach.textContent='↗ Separate window';detach.dataset.detach=id;detach.addEventListener('click',()=>detachPanel(id));controls.append(select,detach);node.prepend(controls);place(id,layout[id]);
  }
  originalBottom.remove();activate('project');
  function activate(id){const position=layout[id];if(windows.has(id)){nodes[id].hidden=false;windows.get(id).win.focus();return;}for(const other of Object.keys(nodes).filter(k=>layout[k]===position&&!windows.has(k))){nodes[other].hidden=other!==id;tabs[other].classList.toggle('active',other===id);}}
  function restore(id){const floating=windows.get(id);if(!floating)return;windows.delete(id);floating.unregister();place(id,layout[id]);if(!floating.win.closed)floating.win.close();}
  function place(id,position){if(!positions.includes(position))return;const floating=windows.get(id);if(floating){windows.delete(id);floating.unregister();if(!floating.win.closed)floating.win.close();}layout[id]=position;slots[position].nav.append(tabs[id]);slots[position].body.append(nodes[id]);nodes[id].querySelector('[aria-label="Dock '+id+'"]').value=position;activate(id);paint();}
  function paint(){for(const [position,{slot,body}]of Object.entries(slots))slot.hidden=!body.children.length;workspace.classList.toggle('dock-has-top',!slots.top.slot.hidden);workspace.classList.toggle('dock-has-bottom',!slots.bottom.slot.hidden);workspace.classList.toggle('dock-has-left',!slots.left.slot.hidden);workspace.classList.toggle('dock-has-right',!slots.right.slot.hidden);}
  function persist(){if(!applying)void save({...layout});}
  function detachPanel(id){if(windows.has(id)||isBusy())return;const win=document.defaultView.open('','_blank','popup,width=850,height=650');if(!win){nodes[id].querySelector('[data-detach]').textContent='Popup blocked · allow and retry';return;}win.document.title='Axiom · '+tabs[id].textContent;const style=win.document.createElement('link');style.rel='stylesheet';style.href=new URL('/styles.css',document.defaultView.location.href).href;win.document.head.append(style);win.document.body.className='detached-editor';const returnButton=win.document.createElement('button');returnButton.textContent='↙ Return to editor';returnButton.addEventListener('click',()=>restore(id));win.document.body.append(returnButton);const unregister=document.attachWindow(win);windows.set(id,{win,unregister});win.document.body.append(nodes[id]);tabs[id].textContent=tabs[id].textContent.replace(/ ↗$/,'')+' ↗';nodes[id].hidden=false;win.addEventListener('pagehide',()=>{tabs[id].textContent=tabs[id].textContent.replace(/ ↗$/,'');restore(id);});const replacement=Object.keys(nodes).find(k=>k!==id&&layout[k]===layout[id]&&!windows.has(k));if(replacement)activate(replacement);paint();}
  document.defaultView.addEventListener('pagehide',()=>{for(const id of [...windows.keys()])restore(id);},{once:true});
  const reset=document.createElement('button');reset.id='dock-reset';reset.textContent='Reset panel layout';reset.addEventListener('click',()=>{if(isBusy())return;for(const id of Object.keys(nodes)){restore(id);place(id,dockDefaults[id]);}activate('project');persist();});document.querySelector('#settings-menu .menu-popup').append(reset);
  return {value:()=>({...layout}),set(value){const next={...dockDefaults,...value};if(Object.keys(nodes).every(id=>next[id]===layout[id]))return;applying=true;for(const id of Object.keys(nodes))if(next[id]!==layout[id])place(id,next[id]);applying=false;}};
}
