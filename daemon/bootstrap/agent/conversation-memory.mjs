// Work journals retain full trajectories. The model receives a bounded, channel-local
// continuation, including actual tool outputs; archived evidence is never a new check.
export function conversationInput(sessions,{projectId,channel,excludeId,maxBytes=80000}){
 const records=[...sessions.values()].filter(s=>s.sourceId===projectId&&s.public.channel===channel&&s.public.id!==excludeId&&s.input?.length).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
 const latest=records.at(-1);if(!latest)return [];
 const input=structuredClone(latest.input).filter(item=>item.role!=='developer');
 // Never truncate the middle of a function-call/output pair. A compact checkpoint
 // already in the journal is used when full prior input exceeds the request budget.
 if(Buffer.byteLength(JSON.stringify(input))<=maxBytes)return input;
 return [{role:'user',content:'Previous task: '+latest.public.originalObjective},{role:'assistant',content:latest.public.response??latest.public.messages?.at(-1)??'Previous task interrupted.'},{role:'developer',content:'Earlier trajectory retained in work.evidence.read. Task '+latest.public.id+'. Archived tools: '+latest.public.steps.map(s=>s.sequence+':'+s.tool+' ('+s.status+')').join(', ')+'. Historical evidence is not a current-state check.'}];
}
