import {StreamingPcm} from '../../../engine/audio/pcm-stream.mjs';
class AxiomPCM extends AudioWorkletProcessor {
 constructor(options){super();this.pcm=new StreamingPcm(options.processorOptions,sampleRate);this.waiting=false;this.blocks=0;this.primed=false;this.desiredPaused=true;this.port.onmessage=event=>{try{const d=event.data;if(d.chunk){this.pcm.push(d.chunk);this.waiting=false;}if(typeof d.paused==='boolean')this.desiredPaused=d.paused;if(d.rate)this.pcm.rate=d.rate;}catch(error){this.port.postMessage({error:error.message});this.pcm.paused=true;}};}
 process(inputs,outputs){const out=outputs[0];if(out.length<2)return true;if(this.pcm.count>=Math.min(8192,this.pcm.frames))this.primed=true;this.pcm.paused=this.desiredPaused||!this.primed;this.pcm.render(out[0],out[1]);if(this.pcm.count<8192&&!this.waiting&&!this.pcm.ended){this.waiting=true;this.port.postMessage({need:true});}if(++this.blocks%32===0)this.port.postMessage(this.pcm.status());return true;}
}
registerProcessor('axiom-pcm',AxiomPCM);
