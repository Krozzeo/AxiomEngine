import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('malformed ZIP64 central directory is rejected without blocking the importer process',()=>{
  // Run separately so an unzip regression cannot freeze the test runner.
  const source=`import {zipSync,unzipSync,strToU8} from 'fflate';
const normal=zipSync({'brief.txt':strToU8('A short project brief')});
const end=normal.length-22,bytes=new Uint8Array(normal.length+76);
bytes.set(normal.subarray(0,end));bytes.set(normal.subarray(end),end+76);
const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
let central=-1;for(let i=0;i<bytes.length-4;i++)if(view.getUint32(i,true)===0x02014b50){central=i;break;}
if(central<0)throw Error('Fixture has no central directory');
view.setUint32(end,0x06064b50,true);view.setUint32(end+4,44,true);
view.setUint32(end+32,1,true);view.setUint32(end+48,central,true);
view.setUint32(end+56,0x07064b50,true);view.setUint32(end+64,end,true);
view.setUint32(central+20,0xffffffff,true);view.setUint16(central+30,0,true);
try{unzipSync(bytes);process.exitCode=1;}catch{console.log('malformed ZIP64 rejected');}`;
  const result=spawnSync(process.execPath,['--input-type=module','--eval',source],{cwd:new URL('..',import.meta.url),timeout:2500,encoding:'utf8'});
  assert.equal(result.error,undefined,'ZIP extraction must terminate before the timeout');
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/malformed ZIP64 rejected/);
});
