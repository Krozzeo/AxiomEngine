// Bounded PCM WAV source import. Playback belongs to the audio milestone.
export function parseWav(bytes) {
  const check=(ok,message)=>{if(!ok)throw Object.assign(new Error(message),{code:"AX_ASSET_0001"});};
  check(bytes.length>=44&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WAVE','Expected PCM WAV');
  check(bytes.readUInt32LE(4)+8===bytes.length,'Invalid WAV container length');
  let format=null,data=null,dataOffset=0,offset=12;
  for(;offset+8<=bytes.length;) {
    const name=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4),start=offset+8;
    check(start+size<=bytes.length,'Truncated WAV chunk');
    if(name==='fmt ') {check(!format&&size>=16,'Invalid WAV format chunk');format={encoding:bytes.readUInt16LE(start),channels:bytes.readUInt16LE(start+2),sampleRate:bytes.readUInt32LE(start+4),byteRate:bytes.readUInt32LE(start+8),blockAlign:bytes.readUInt16LE(start+12),bits:bytes.readUInt16LE(start+14)};}
    if(name==='data') {check(data===null,'Multiple WAV data chunks');data=size;dataOffset=start;}
    offset=start+size+(size%2);check(offset<=bytes.length,'Missing WAV chunk padding');
  }
  check(offset===bytes.length,"Trailing incomplete WAV chunk");
  check(format&&data!==null&&data>0,'Missing WAV data or format');
  const {encoding,channels,sampleRate,byteRate,blockAlign,bits}=format;
  check(encoding===1&&[1,2].includes(channels)&&[8,16,24,32].includes(bits)&&sampleRate>=8000&&sampleRate<=192000,'Supported WAV: PCM mono/stereo, 8–32 bits, 8–192 kHz');
  check(blockAlign===channels*bits/8&&byteRate===sampleRate*blockAlign&&data%blockAlign===0,'Invalid WAV sample alignment');
  return {kind:'audio',channels,sampleRate,bits,frames:data/blockAlign,durationSeconds:data/byteRate,dataOffset,mime:'audio/wav'};
}

export function readPcm(bytes,offset,frames){
 const a=parseWav(bytes);if(!Number.isSafeInteger(offset)||offset<0||offset>=a.frames||!Number.isSafeInteger(frames)||frames<1||frames>4096)throw Object.assign(Error('Invalid PCM frame range'),{code:'AX_ASSET_0001'});
 const count=Math.min(frames,a.frames-offset),samples=[];for(let i=0;i<count*a.channels;i++){const n=a.dataOffset+(offset*a.channels+i)*a.bits/8;let value;if(a.bits===8)value=(bytes[n]-128)/128;else if(a.bits===16)value=bytes.readInt16LE(n)/32768;else if(a.bits===24)value=bytes.readIntLE(n,3)/8388608;else value=bytes.readInt32LE(n)/2147483648;samples.push(value);}
 return {offset,frames:count,channels:a.channels,sampleRate:a.sampleRate,totalFrames:a.frames,samples};
}
