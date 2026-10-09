import {projectFiles} from '../../../engine/scene/project-files.mjs';
import {scriptMetadata} from '../../../engine/scripting/fields.mjs';

// One compiler flight shared by toolbar, Play, project opening and automatic saves.
export function mountCompileController({document,getState,dirty,compile,saveAuto,reportError,onCompiled=()=>{}}) {
 const q=id=>document.querySelector('#'+id); let flight=null,failed=null,timer=null,pendingAuto=null,lastKind=null,wasPlaying=!!getState().playing;
 const signature=()=>JSON.stringify([getState().project?.id,projectFiles(getState().project?.scene??{}).filter(f=>f.kind==='script').map(f=>[f.path,f.text]),q('script-mode')?.value??'development']);
 let cached=null,hash=null,ticket=0;
 function draw(){const state=getState(),stopped=wasPlaying&&!state.playing;wasPlaying=!!state.playing;const key=signature();if(key!==cached){cached=key;hash=null;const next=++ticket;const files=JSON.parse(key)[1];void crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(files))).then(bytes=>{if(next!==ticket)return;hash=[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');paint();});}paint();if(stopped&&state.project?.editor?.autoCompile&&needsCompile()){clearTimeout(timer);timer=setTimeout(()=>void request({flush:false,onlyChanged:true}),0);}}
 function paint(){const state=getState(),files=projectFiles(state.project?.scene??{}).filter(f=>f.kind==='script'),changed=dirty()||files.length>0&&(hash===null||hash!==state.project?.scene.script?.build.sourceHash||state.project?.scene.script?.build.sdkVersion!==2||state.project.scene.script.build.mode!==(q('script-mode')?.value??'development'));
  const error=failed===cached&&!dirty(),kind=flight?'compiling':error?'error':changed?'pending':'compiled';if(kind==='compiled'&&lastKind!=='compiled')onCompiled();lastKind=kind;const button=q('toolbar-compile');if(!button)return;
  button.dataset.state=kind;button.dataset.playing=String(!!state.playing);button.disabled=state.playing||!state.project||!!state.workspaceId||!!flight||hash===null||!changed||error;button.classList?.toggle?.('dirty-compile',kind==='pending');q('compile-label').textContent={compiling:'Compiling',error:'Error',pending:'Compile*',compiled:'Compiled'}[kind];q('compile-icon').src='/icons/'+{compiling:'compiling',error:'compile-error',pending:'compile',compiled:'compile-ok'}[kind]+'.svg';button.title=state.playing?'Stop Play before compiling Project scripts':kind==='error'?'Compilation failed. Edit the source and retry; diagnostics are in IDE':'Compile Project scripts · Ctrl+D';q('compile-auto').checked=pendingAuto??!!state.project?.editor?.autoCompile;q('compile-auto').disabled=!state.project||!!state.workspaceId||pendingAuto!==null;
 }
 async function request({flush=true,force=false,legacy=false,onlyChanged=false}={}){const state=getState();if(state.playing||!state.project||state.workspaceId)return false;if(flight)return flight;if(!force&&!needsCompile())return true;if(!force&&failed===signature()&&(!dirty()||!flush))return false;
  if(onlyChanged&&hash!==null&&hash===state.project.scene.script?.build.sourceHash&&state.project.scene.script?.build.sdkVersion===2)return true;
  const file=projectFiles(state.project.scene).find(f=>f.kind==='script'&&(()=>{try{return !!scriptMetadata(f);}catch{return false;}})())??projectFiles(state.project.scene).find(f=>f.kind==='script');if(!file&&!legacy){draw();return true;}
  clearTimeout(timer);flight=(async()=>{try{const ok=await compile(legacy?undefined:file.path,{flush});if(!ok){failed=signature();return false;}failed=null;return true;}catch(error){failed=signature();reportError(error);return false;}finally{flight=null;draw();}})();paint();return flight;
 }
 function sourceSaved(){draw();clearTimeout(timer);if(getState().project?.editor?.autoCompile&&!getState().playing){timer=setTimeout(()=>void request({flush:false,onlyChanged:true}),500);}}
 q('toolbar-compile')?.addEventListener('click',()=>void request());q('compile-auto')?.addEventListener('change',async()=>{pendingAuto=q('compile-auto').checked;paint();try{await saveAuto(pendingAuto);}catch(error){reportError(error);}finally{pendingAuto=null;draw();}});
 document.addEventListener?.('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.code==='KeyD'){event.preventDefault();event.stopPropagation();void request();}});
 function needsCompile(){return dirty()||projectFiles(getState().project?.scene??{}).some(f=>f.kind==='script')&&(hash===null||hash!==getState().project?.scene.script?.build.sourceHash||getState().project?.scene.script?.build.sdkVersion!==2||getState().project?.scene.script?.build.mode!==(q('script-mode')?.value??'development'));}
 return {draw,request,sourceSaved,needsCompile,dispose(){clearTimeout(timer);}};
}
