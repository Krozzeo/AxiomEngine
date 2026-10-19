// Credentials travel only to the local daemon; never retain them in editor state or logs.
export function mountGitHubEditor({document,api,reportError}){
 const button=document.querySelector('#github-indicator');
 if(!button||!document.defaultView)return {setSnapshot(){}};
 const dialog=document.createElement('dialog');dialog.id='github-dialog';dialog.className='github-dialog';dialog.setAttribute('aria-label','GitHub publication');
 dialog.innerHTML=`<div class="actions"><h2>GitHub · game project</h2><button id="gh-close" aria-label="Close GitHub">Close</button></div>
 <p id="gh-status" role="status"></p><p id="gh-error" role="alert"></p>
 <section><h3>Account</h3><p>Use a fine-grained access token for the game repositories you choose, with Contents read/write. Creating a repository requires permission to create repositories. The connection lasts until this daemon closes.</p>
 <label>GitHub access token<input id="gh-token" type="password" autocomplete="off" maxlength="512"></label><div class="actions"><button id="gh-connect">Connect</button><button id="gh-disconnect">Disconnect</button></div></section>
 <section><h3>Destination</h3><button id="gh-repositories">List my repositories</button><select id="gh-repository-list" aria-label="Available game repositories"><option value="">Choose a game repository</option></select>
 <label>Owner / repository<input id="gh-repository" placeholder="your-account/your-game"></label><label>Publication branch<input id="gh-branch" value="axiom-publication"></label><label><input id="gh-create-branch" type="checkbox">Create this branch from the repository default branch if it does not exist</label><button id="gh-configure">Use this destination</button>
 <details><summary>Create a game repository</summary><label>Repository name<input id="gh-new-name" maxlength="100"></label><label><input id="gh-private" type="checkbox" checked>Private repository</label><button id="gh-create">Create repository</button></details></section>
 <section><h3>Publication</h3><p>Only saved, applied MAIN is published. Save the project and stop Play first. Proposal previews cannot be published.</p><label><input id="gh-auto" type="checkbox">Automatically publish newly delivered milestones after saving</label><label><input id="gh-agent" type="checkbox">Allow publication when the AI agent requests it</label><button id="gh-preferences">Save publication preferences</button>
 <div class="actions"><button id="gh-preview">Review saved changes</button><button id="gh-publish" disabled>Publish reviewed changes</button></div><label>Commit summary (optional)<input id="gh-message" maxlength="120"></label><p id="gh-preview-summary"></p><ul id="gh-files"></ul><p id="gh-last"></p>
 <div class="actions"><button id="gh-reconcile">Check an unconfirmed publication</button><button id="gh-retry">Retry the same publication</button></div></section>`;
 document.body.append(dialog);const q=id=>dialog.querySelector('#gh-'+id);let snapshot=null,status=null,plan=null,working=false,stopped=false,refreshing=false,preferencesEdited=false;
 const post=(action,data={})=>api('/v1/github/'+action,{method:'POST',body:JSON.stringify(data)});
 const identity=()=>({id:snapshot?.project?.id,expectedSceneRevision:snapshot?.sceneRevision});
 function paint(){if(!status)return;button.classList.toggle('disconnected',!status.connected);button.classList.toggle('publication-pending',status.pendingPublication);button.title=status.connected?'GitHub: '+status.account.login+(status.pendingPublication?' · saved changes pending publication':' · up to date'):'Connect GitHub';document.querySelector('#github-pending').hidden=!status.pendingPublication;
  q('status').textContent=(status.connected?'Connected as '+status.account.login:'Disconnected')+' · '+(status.repository?status.repository+' / '+status.branch:'Choose a destination')+(status.ambiguous?' · Publication needs verification':status.pendingPublication?' · Changes pending publication':' · Up to date');
  if(!preferencesEdited){q('auto').checked=status.autoMilestones;q('agent').checked=status.allowAgent;}
  if(!dialog.open||!q('repository').value){q('repository').value=status.repository??'';q('branch').value=status.branch??'axiom-publication';}
  q('publish').disabled=working||!plan||!status.canPrepare;q('preview').disabled=working||!status.canPrepare;q('reconcile').disabled=working||!status.ambiguous;q('retry').disabled=working||!status.ambiguous;
  q('last').replaceChildren();if(status.lastPublication){const link=document.createElement('a');link.textContent='Last publication · '+status.lastPublication.sha.slice(0,8);link.href=status.lastPublication.url;link.target='_blank';link.rel='noopener noreferrer';q('last').append(link);}
 }
 async function refresh(){if(refreshing||stopped)return;refreshing=true;try{status=await api('/v1/github/status');paint();}finally{refreshing=false;}}
 async function act(operation){if(working)return;working=true;q('error').textContent='';paint();try{await operation();}catch(error){plan=null;q('error').textContent=error.message;reportError(error);}finally{working=false;await refresh().catch(()=>{});paint();}}
 for(const id of ['auto','agent'])q(id).addEventListener('change',()=>{preferencesEdited=true;});
 const on=(id,operation)=>q(id).addEventListener('click',()=>void act(operation));
 button.addEventListener('click',()=>{dialog.showModal();void refresh().catch(reportError);});q('close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{q('token').value='';});
 on('connect',async()=>{const token=q('token').value;q('token').value='';await post('connect',{token});plan=null;});
 on('disconnect',async()=>{await post('disconnect');plan=null;});
 on('repositories',async()=>{const result=await api('/v1/github/repositories');q('repository-list').replaceChildren();for(const item of result.items.filter(r=>r.canPush)){const option=document.createElement('option');option.value=item.name;option.textContent=item.name+(item.private?' · private':' · public');q('repository-list').append(option);}q('repository-list').selectedIndex=-1;});
 q('repository-list').addEventListener('change',()=>{q('repository').value=q('repository-list').value;});
 on('create',async()=>{const repo=await post('create',{name:q('new-name').value,private:q('private').checked});q('repository').value=repo.name;q('branch').value=repo.branch;plan=null;q('preview-summary').textContent='Repository created. Select Use this destination to configure publication.';});
 on('configure',async()=>{await post('configure',{...identity(),repository:q('repository').value,branch:q('branch').value,createBranch:q('create-branch').checked});plan=null;});
 on('preferences',async()=>{await post('preferences',{id:snapshot?.project?.id,autoMilestones:q('auto').checked,allowAgent:q('agent').checked});preferencesEdited=false;});
 on('preview',async()=>{plan=await post('preview',identity());q('preview-summary').textContent=plan.changes.length+' changed files · '+plan.repository+' / '+plan.branch;q('files').replaceChildren();for(const item of plan.changes){const row=document.createElement('li');row.textContent=item.kind+' · '+item.path;q('files').append(row);}});
 on('publish',async()=>{await post('publish',{...identity(),planId:plan?.planId,...(q('message').value.trim()?{message:q('message').value.trim()}:{})});plan=null;q('preview-summary').textContent='Publication confirmed.';q('files').replaceChildren();});
 on('reconcile',async()=>{await post('reconcile',identity());plan=null;});on('retry',async()=>{await post('retry',identity());plan=null;});
 const timer=setInterval(()=>void refresh().catch(()=>{}),2500);globalThis.addEventListener('pagehide',()=>{stopped=true;clearInterval(timer);q('token').value='';},{once:true});
 return {setSnapshot(value){if(snapshot?.project?.id!==value.project?.id||snapshot?.sceneRevision!==value.sceneRevision){plan=null;preferencesEdited=false;q('files').replaceChildren();q('preview-summary').textContent='';}snapshot=value;void refresh().catch(()=>{});}};
}
