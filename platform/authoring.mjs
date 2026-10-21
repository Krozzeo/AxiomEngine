const reject=(code,message)=>{throw Object.assign(Error(message),{code});};
// Product-owned port; no scene model crosses into Platform.
export function createAuthoringPort({workspace,bus,proposals}) {
  const editors=new Map();
  const run=workspace.run.bind(workspace);
  const lifecycle=['project.create','project.open','project.close','project.save','project.delete'];
  workspace.run=async(type,data,context)=>{
    if(lifecycle.includes(type))reject('AX_SCENE_0003','Manage this project session from Axiom Platform.');
    return run(type,data,context);
  };
  const buffers=()=>[...editors.values()].some(e=>e.dirty);
  const status=()=>({projectId:workspace.project?.id??null,name:workspace.project?.name??null,revision:workspace.revision,savedRevision:workspace.project?.revision??null,dirty:workspace.dirty||buffers(),pendingBuffers:buffers(),busy:!!(workspace.activeJob||workspace.activeScriptJob||workspace.playing||proposals.previewId||bus.agentService.assistant?.active)});
  const idle=()=>{if(status().busy)reject('projectBusy','Stop Play and resolve active jobs or previews before managing the session.');};
  const revision=expected=>{if(!Number.isSafeInteger(expected)||expected!==workspace.revision)reject('revisionConflict','The editor changed. Refresh the session before saving or closing.');};
  return {
    reportEditor:data=>{
      if(typeof data?.clientId!=='string'||data.clientId.length>80||typeof data.dirty!=='boolean'||!Number.isSafeInteger(data.sequence)||data.sequence<0)reject('invalidRequest','Invalid editor state.');
      if(!editors.has(data.clientId)&&editors.size>=32)reject('projectBusy','Too many editor tabs in this session.');
      if((editors.get(data.clientId)?.sequence??-1)<data.sequence)editors.set(data.clientId,{dirty:data.dirty,sequence:data.sequence});
      return {reported:true};
    },
    status:()=>bus.transaction(async()=>({status:status()})),
    open:id=>bus.transaction(async()=>{await run('project.open',{id});return status();}),
    create:name=>bus.transaction(async()=>{await run('project.create',{name});return status();}),
    save:expected=>bus.transaction(async()=>{
      idle();revision(expected);
      if(buffers())reject('projectBusy','Save pending code buffers from the editor before saving this session.');
      await run('scene.save',{id:workspace.project?.id,expectedSceneRevision:expected});
      bus.onCommitted?.('scene.save');return {status:status()};
    }),
    close:(expected,decision)=>bus.transaction(async()=>{
      if(decision==='cancel')return {cancelled:true,closed:false,status:status()};
      idle();revision(expected);
      if(!['save','discard'].includes(decision))reject('invalidRequest','Choose Save and close, Discard and close, or Cancel.');
      if(buffers()&&decision==='save')reject('projectBusy','Save pending code buffers from the editor first, or explicitly discard and close.');
      if(workspace.dirty&&decision==='save')await run('scene.save',{id:workspace.project.id,expectedSceneRevision:workspace.revision});
      if(buffers()&&decision==='save')reject('projectBusy','A code buffer changed during Save. Save it in the editor before closing.');
      await run('project.close',{id:workspace.project.id,expectedSceneRevision:workspace.revision,discardChanges:decision==='discard'});
      return {closed:true,status:status()};
    })
  };
}
