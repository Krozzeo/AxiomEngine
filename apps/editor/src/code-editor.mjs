import {projectFiles} from '../../../engine/scene/project-files.mjs';
// A bounded source editor over canonical Project transactions; never executes code.
export function mountCodeEditor({document,getState,write,show,onDirty=()=>{},onOpen=()=>{},reportError}) {
 if(!document.defaultView)return {draw(){},flush:async()=>true,dirty:()=>false,open(){},filesChanged(){}};
 const q=id=>document.querySelector('#'+id),buffers=new Map();let current=null,projectId=null,flight=null;
 const sceneFile=path=>getState().project?projectFiles(getState().project.scene).find(f=>f.path===path):undefined;
 const dirty=()=>[...buffers.values()].some(b=>b.text!==b.saved);
 function lines(){q('ide-lines').textContent=Array.from({length:(q('ide-code').value.match(/\n/g)?.length??0)+1},(_,i)=>i+1).join('\n');q('ide-lines').scrollTop=q('ide-code').scrollTop;}
 function paint(){const b=buffers.get(current),disabled=!b||getState().playing||getState().workspaceId;q('ide-code').disabled=!!disabled;q('ide-file-save').disabled=disabled||!dirty();q('ide-status').textContent=b?current+(b.text!==b.saved?' *':''):'Double-click a C# file in Project to open it';if(q('ide-code').value!==(b?.text??''))q('ide-code').value=b?.text??'';lines();onDirty(dirty());}
 async function flush(){if(flight)return flight;flight=(async()=>{for(const[path,b]of buffers){if(b.text===b.saved)continue;const text=b.text;const ok=await write({action:'write',path,text});if(ok!==true)throw Error('Source was not saved; finish the current editor operation and retry');b.saved=text;onOpen({...sceneFile(path),path,kind:'script',text});}onDirty(dirty());return true;})().finally(()=>{flight=null;paint();});return flight;}
 async function open(file){if(file.kind!=='script')return;try{await flush();current=file.path;if(!buffers.has(current))buffers.set(current,{text:file.text,saved:file.text});show('ide');onOpen(file);paint();q('ide-code').focus();}catch(e){reportError(e);}}
 function draw(){const state=getState();if(state.project?.id!==projectId){buffers.clear();current=null;projectId=state.project?.id;}for(const[path,b]of buffers){const f=sceneFile(path);if(!f){if(b.text===b.saved){buffers.delete(path);if(current===path)current=null;}continue;}if(b.text===b.saved&&f.text!==b.saved){b.text=b.saved=f.text;if(path===current)onOpen(f);}}paint();}
 function filesChanged(data){if(data.action==='move'){for(const[path,b]of [...buffers])if(path===data.path||path.startsWith(data.path+'/')){buffers.delete(path);const next=data.to+path.slice(data.path.length),f=sceneFile(next);buffers.set(next,{text:f?.text??b.text,saved:f?.text??b.saved});if(current===path){current=next;if(f)onOpen(f);}}}draw();}
 q('ide-code').addEventListener('input',()=>{const b=buffers.get(current);if(b){b.text=q('ide-code').value;lines();q('ide-file-save').disabled=!dirty();q('ide-status').textContent=current+' *';onDirty(dirty());}});
 q('ide-code').addEventListener('scroll',lines);
 q('ide-code').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const code=q('ide-code'),start=code.selectionStart,end=code.selectionEnd;code.setRangeText('    ',start,end,'end');code.dispatchEvent(new Event('input',{bubbles:true}));}});
 q('ide-file-save').addEventListener('click',()=>void flush().catch(reportError));
 q('ide-find').addEventListener('input',()=>{const code=q('ide-code'),word=q('ide-find').value;if(!word)return;const index=code.value.toLowerCase().indexOf(word.toLowerCase());q('ide-search-status').textContent=index<0?'Not found':'';if(index>=0){code.setSelectionRange(index,index+word.length);}});
 return {draw,flush,dirty,open,filesChanged};
}
