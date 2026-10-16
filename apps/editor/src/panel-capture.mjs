// Capture Axiom surfaces only; this is not an OS screenshot or a remote URL reader.
const selectors={hierarchy:'.hierarchy',inspector:'.inspector',project:'#project-content',console:'#console-content',diagnostics:'#diagnostics-content',profiler:'#profiler-content',ide:'#ide-content',assistant:'#ai-assistant-content',pmd:'#pmd-content',scripting:'#scripting-api-content'};
export async function capturePanel(args,renderer,document=globalThis.document){
 const panel=args.panel??'current';
 if(['current','scene','game'].includes(panel))return renderer.capture(args);
 const node=document.querySelector(selectors[panel]??':not(*)');
 if(!node||node.hidden||!node.getBoundingClientRect().width||node.closest('[hidden]'))throw Error('Panel '+panel+' is closed or not visible; open it before capturing');
 const status=renderer.status(),revision=()=>{const now=renderer.status();if(now.projectId!==args.id||now.sceneRevision!==args.expectedSceneRevision||(now.workspaceId??null)!==(args.workspaceId??null)||now.generation!==status.generation)throw Error('Panel capture revision changed');};revision();
 const doc=node.ownerDocument,view=doc.defaultView,clone=node.cloneNode(true),original=[node,...node.querySelectorAll('*')],copies=[clone,...clone.querySelectorAll('*')];
 if(original.length>6000)throw Error('Panel capture DOM exceeds limit');
 for(let i=0;i<original.length;i++){
  const source=original[i],target=copies[i],style=view.getComputedStyle(source);target.removeAttribute('id');
  for(const attribute of [...target.attributes])if(attribute.name.startsWith('on'))target.removeAttribute(attribute.name);
  target.style.cssText=Array.from(style).map(key=>key+':'+style.getPropertyValue(key)).join(';');
  if(source.matches('script,iframe,object,embed,link')){target.remove();continue;}
  if(source.matches('input,textarea,select')){target.textContent=source.type==='password'?'[redacted]':source.value;target.setAttribute('value',source.type==='password'?'':source.value);}
  if(source.tagName==='CANVAS'){const image=doc.createElement('img');image.src=source.toDataURL('image/png');image.style.cssText=target.style.cssText;target.replaceWith(image);}
  if(source.tagName==='IMG'&&!/^(data:|blob:)/.test(source.src)){target.removeAttribute('src');target.alt=source.alt||'[image]';}
 }
 const rect=node.getBoundingClientRect(),width=args.width??640,height=args.height??360;clone.style.margin='0';clone.style.width=rect.width+'px';clone.style.height=rect.height+'px';
 const markup=new XMLSerializer().serializeToString(clone);if(markup.length>4*1024*1024)throw Error('Panel capture DOM exceeds limit');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${rect.width} ${rect.height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`;
 const image=new view.Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Panel image rasterization unavailable'));image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);});
 const canvas=doc.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(image,0,0,width,height);revision();
 const data=canvas.toDataURL('image/png'),base64=data.split(',')[1];if(base64.length>699050)throw Error('Panel capture exceeds 512 KiB');
 return {...status,panel,width,height,capturedAt:new Date().toISOString(),base64,semantic:{channel:'editor-ui',method:'DOM rasterization',panel}};
}
