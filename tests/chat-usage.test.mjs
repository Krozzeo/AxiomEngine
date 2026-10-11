import test from 'node:test';
import assert from 'node:assert/strict';
import {tokenMeterState,paintTokenMeter} from '../apps/editor/src/chat-usage.mjs';
test('both chat meters reflect accumulated session usage and changed limits without reset',()=>{
 const status={sessionUsage:{totalTokens:11000},limits:{maxTokens:20000}};assert.equal(tokenMeterState(status).label,'55.0%');status.limits.maxTokens=40000;assert.equal(tokenMeterState(status).label,'27.5%');assert.match(tokenMeterState(status).description,/29,000/);status.limits.maxTokens=10000;assert.equal(tokenMeterState(status).percent,100);status.limits.maxTokens=null;assert.equal(tokenMeterState(status).label,'∞');assert.equal(tokenMeterState(status).percent,0);
 const fill={style:{}},label={},attrs={},meter={setAttribute:(k,v)=>attrs[k]=v,querySelector:t=>t==='span'?fill:label};paintTokenMeter(meter,{sessionUsage:{totalTokens:50},limits:{maxTokens:200}});assert.equal(attrs['aria-valuenow'],'25');assert.equal(fill.style.width,'25%');assert.equal(label.textContent,'25.0%');assert.match(meter.title,/150/);
});
