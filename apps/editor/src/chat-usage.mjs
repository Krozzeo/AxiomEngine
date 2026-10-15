export function tokenMeterState(status){
 const used=status?.sessionUsage?.totalTokens??0,limit=status?.limits?.maxTokens;
 const percent=limit==null?0:Math.min(100,Math.max(0,used/Math.max(1,limit)*100));
 return {percent,label:limit==null?'∞':(percent<100?percent.toFixed(1):'100')+'%',description:'Project total: '+used.toLocaleString()+' tokens · Limit: '+(limit==null?'Limitless':limit.toLocaleString())+' · Remaining: '+(limit==null?'Limitless':Math.max(0,limit-used).toLocaleString()),aria:used+' of '+(limit==null?'unlimited':limit)+' tokens used'};
}
export function paintTokenMeter(meter,status){
 const state=tokenMeterState(status);meter.setAttribute('aria-valuenow',String(state.percent));meter.setAttribute('aria-valuetext',state.aria);meter.title=state.description;meter.querySelector('span').style.width=state.percent+'%';meter.querySelector('strong').textContent=state.label;
}
