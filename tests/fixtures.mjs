import { PNG } from "pngjs";
export function imageFixture() {
  const png=new PNG({width:32,height:32});
  for(let y=0;y<32;y++)for(let x=0;x<32;x++) {
    const at=(y*32+x)*4, stripe=(Math.floor(x/8)+Math.floor(y/8))%2;
    png.data.set(stripe?[80,210,170,255]:[245,200,80,255],at);
  }
  return PNG.sync.write(png);
}
export function glbFixture(edit=()=>{}) {
  const positions=[-.7,-.7,.7,.7,-.7,.7,.7,.7,.7,-.7,.7,.7,-.7,-.7,-.7,.7,-.7,-.7,.7,.7,-.7,-.7,.7,-.7];
  const indices=[0,1,2,0,2,3,1,5,6,1,6,2,5,4,7,5,7,6,4,0,3,4,3,7,3,2,6,3,6,7,4,5,1,4,1,0];
  const bin=Buffer.alloc(positions.length*4+indices.length*2);
  positions.forEach((n,i)=>bin.writeFloatLE(n,i*4));indices.forEach((n,i)=>bin.writeUInt16LE(n,positions.length*4+i*2));
  const doc={asset:{version:"2.0"},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,rotation:[0,Math.sin(.3),0,Math.cos(.3)]}],meshes:[{primitives:[{attributes:{POSITION:0},indices:1,material:0}]}],materials:[{pbrMetallicRoughness:{baseColorFactor:[.95,.3,.12,1]}}],buffers:[{byteLength:bin.length}],bufferViews:[{buffer:0,byteOffset:0,byteLength:positions.length*4},{buffer:0,byteOffset:positions.length*4,byteLength:indices.length*2}],accessors:[{bufferView:0,componentType:5126,count:8,type:"VEC3",min:[-.7,-.7,-.7],max:[.7,.7,.7]},{bufferView:1,componentType:5123,count:36,type:"SCALAR"}]};
  edit(doc,bin);
  const json=Buffer.from(JSON.stringify(doc)), padded=Buffer.alloc(Math.ceil(json.length/4)*4,32);json.copy(padded);
  const out=Buffer.alloc(12+8+padded.length+8+bin.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(padded.length,12);out.writeUInt32LE(0x4e4f534a,16);padded.copy(out,20);const offset=20+padded.length;out.writeUInt32LE(bin.length,offset);out.writeUInt32LE(0x004e4942,offset+4);bin.copy(out,offset+8);return out;
}
