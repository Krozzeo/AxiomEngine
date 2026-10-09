// The browser owns presentation only. No credential is cached in browser storage,
// project settings or the conversation. All model/tool authority lives in daemon.
export function mountAiAssistant({document,api,getSnapshot,openPanel,reportError}){
 if(!document.defaultView)return ()=>{};
 const q=id=>document.querySelector('#'+id),limitNames=['maxRequests','maxTools','maxTokens','maxOutputTokens','maxSeconds'];
 let stopped=false,configBusy=false,status=null,task=null,configKey=null,wasConnected=false,renderKey=null,projectKey=null;const turns=new Map();
 const post=(path,data)=>api('/v1/ai/'+path,{method:'POST',body:JSON.stringify(data)});
 const modelConfig=()=>({model:q('ai-model').value,limits:Object.fromEntries(limitNames.map(n=>[n,Number(q('ai-'+n).value)]))});
 function configureMenu(){const menu=q('ai-menu');for(const branch of menu.querySelectorAll('details'))branch.open=false;menu.open=true;q('ai-assistant-config').open=true;}
 function showChat(){openPanel('assistant',{centerIfClosed:true});q('ai-menu').open=false;}
 function paint(){const s=getSnapshot(),connected=!!status?.connected,working=!!status?.working;
  q('ai-indicator-label').textContent=working?'AI Working':'AI Agent';q('ai-indicator-icon').src=working?'/icons/compiling.svg':connected?'/icons/ai.svg':'/icons/ai-off.svg';q('ai-indicator').classList.toggle('disconnected',!connected&&!working);q('ai-indicator').title=connected?'Open AI Assistant · '+status.model:'Configure AI Assistant';
  const hasPmd=!!s?.project?.editor?.masterDocument?.text;q('pmd-indicator').classList.toggle('disconnected',!hasPmd);q('pmd-indicator').querySelector('img').src=hasPmd?'/icons/compile-ok.svg':'/icons/minus.svg';q('pmd-indicator').title=hasPmd?'Project Master Document loaded':'No Project Master Document loaded';
  q('ai-talk').disabled=!connected;const panelButton=document.querySelector('[data-open-panel="assistant"]');if(panelButton)panelButton.disabled=!connected;
  q('ai-chat-send').disabled=!connected||working||!s?.project||s.playing||!!s.workspaceId;q('ai-chat-cancel').disabled=!working;q('ai-chat-review').disabled=!task?.proposalAvailable||task.status==='running';
  for(const id of ['ai-connect-test','ai-models','ai-limits-save'])q(id).disabled=configBusy||working;
  q('ai-disconnect').disabled=configBusy||(!status?.hasCredential&&!connected);
  if(connected&&!wasConnected)showChat();wasConnected=connected;
 }
 async function configAction(action){if(configBusy)return;configBusy=true;paint();q('ai-config-status').textContent=action==='connect'?'Testing model connection…':action==='models'?'Loading models…':'Updating configuration…';
  try{const key=q('ai-api-key').value;const value=await post('configure',{action,...(['connect','models'].includes(action)&&key?{apiKey:key}:{}),...(action==='connect'?modelConfig():action==='update'?{limits:modelConfig().limits}:{})});
   if(action==='models'){q('ai-model-options').replaceChildren();for(const model of value.models){const option=document.createElement('option');option.value=model;q('ai-model-options').append(option);}q('ai-config-status').textContent='Loaded '+value.models.length+' models. Choose a text/function-calling model and test it.';}
   else{status=value;q('ai-config-status').textContent=action==='connect'?'Connected · '+value.model:action==='disconnect'?'Disconnected; daemon credential cleared.':'Task limits updated.';if(action==='connect')q('ai-api-key').value='';}
  }catch(error){q('ai-config-status').textContent=error.message;reportError(error);}finally{configBusy=false;paint();}
 }
 q('ai-config-form').addEventListener('submit',e=>{e.preventDefault();void configAction('connect');});q('ai-models').addEventListener('click',()=>void configAction('models'));q('ai-limits-save').addEventListener('click',()=>void configAction('update'));q('ai-disconnect').addEventListener('click',()=>void configAction('disconnect'));
 q('ai-talk').addEventListener('click',showChat);q('ai-indicator').addEventListener('click',()=>status?.connected?showChat():configureMenu());
 q('ai-chat-form').addEventListener('submit',async e=>{e.preventDefault();if(q('ai-chat-send').disabled)return;const text=q('ai-chat-input').value.trim();if(!text)return;q('ai-chat-send').disabled=true;q('ai-chat-error').textContent='';try{const workspaceId=q('ai-chat-continue').checked&&task?.proposalAvailable?task.workspaceId:null;task=await post('tasks',{text,...(workspaceId?{workspaceId}:{})});turns.set(task.id,task);q('ai-chat-input').value='';status={...status,working:true,activeTaskId:task.id};renderTask();paint();}catch(error){q('ai-chat-error').textContent=error.message;reportError(error);paint();}});
 q('ai-chat-cancel').addEventListener('click',async()=>{try{task=await post('cancel',{id:status.activeTaskId});renderTask();}catch(error){q('ai-chat-error').textContent=error.message;reportError(error);}});
 q('ai-chat-review').addEventListener('click',()=>{if(!task?.proposalAvailable)return;const list=q('proposal-list');if([...list.options].some(o=>o.value===task.workspaceId)){list.value=task.workspaceId;list.dispatchEvent(new list.ownerDocument.defaultView.Event('change'));}const menu=q('ai-menu');for(const branch of menu.querySelectorAll('details'))branch.open=false;menu.open=true;q('ai-proposals').open=true;q('proposal-review').click();});
 function renderTask(){if(task)turns.set(task.id,task);const key=JSON.stringify([...turns.values()].filter(t=>t.projectId===getSnapshot()?.project?.id));if(key===renderKey)return;renderKey=key;const output=q('ai-chat-messages'),nearEnd=output.scrollHeight-output.scrollTop-output.clientHeight<100;output.replaceChildren();for(const turn of turns.values()){if(turn.projectId!==getSnapshot()?.project?.id)continue;const user=document.createElement('article');user.className='ai-message user';const title=document.createElement('strong');title.textContent='You';const text=document.createElement('p');text.textContent=turn.objective;user.append(title,text);output.append(user);for(const message of turn.messages??[]){const reply=document.createElement('article');reply.className='ai-message assistant';const author=document.createElement('strong');author.textContent='AI Assistant';const content=document.createElement('p');content.textContent=message;reply.append(author,content);output.append(reply);}if(turn.error){const error=document.createElement('p');error.className='error';error.textContent=turn.error.message;output.append(error);}}
  if(nearEnd)output.scrollTop=output.scrollHeight;if(!task){q('ai-task-status').textContent='Connect a model and send a task.';q('ai-task-steps').replaceChildren();return;}
  q('ai-task-status').textContent=task.status+' · '+task.phase+' · '+task.requests+' requests · '+task.toolCalls+' tool calls · '+task.usage.totalTokens+' reported tokens'+(task.workspaceId?' · isolated proposal':'');q('ai-task-steps').replaceChildren();for(const step of task.steps){const item=document.createElement('li');item.textContent=step.tool+' · '+step.status+(step.error?' · '+step.error:'');q('ai-task-steps').append(item);}
 }
 async function poll(){try{status=await api('/v1/ai/status');const projectId=getSnapshot()?.project?.id;if(projectKey!==projectId){projectKey=projectId;task=null;renderKey=null;renderTask();}
   const nextKey=JSON.stringify([status.model,status.limits]);if(nextKey!==configKey){configKey=nextKey;if(!q('ai-model').value)q('ai-model').value=status.model;for(const name of limitNames)if(q('ai-'+name).ownerDocument.activeElement!==q('ai-'+name))q('ai-'+name).value=String(status.limits[name]);}
   const id=status.activeTaskId??status.lastTaskId;if(id){const next=await api('/v1/ai/tasks?id='+encodeURIComponent(id));if(next.projectId===projectId){task=next;renderTask();}}
   paint();
  }catch(error){if(!stopped){q('ai-chat-error').textContent=error.message;status={...status,connected:false};paint();}}finally{if(!stopped)setTimeout(poll,500);}}
 void poll();return ()=>{stopped=true;q('ai-api-key').value='';};
}
