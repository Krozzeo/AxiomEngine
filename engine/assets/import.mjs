import {advancedFormat,parseObj,parseStl} from './advanced.mjs';
import {animationMetadata} from './animation-import.mjs';
import {createHash} from 'node:crypto';
// Static glTF 2.0/PNG import. No external resource fetches or executable content.
import { parseWav } from "./audio.mjs";
import { PNG } from "pngjs";
export const ASSET_BYTES = 8 * 1024 * 1024;
const fail = message => { throw Object.assign(new Error(message), { code: "AX_ASSET_0001" }); };
const check = (condition, message) => { if (!condition) fail(message); };
const integer = (value, max = 1e9) => Number.isSafeInteger(value) && value >= 0 && value <= max;
const array = (value, size) => Array.isArray(value) && value.length === size && value.every(Number.isFinite);

export function pngInfo(bytes) {
  check(bytes.length >= 33 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), "Expected a PNG image");
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  check(width > 0 && height > 0 && width <= 2048 && height <= 2048, "Images must be between 1 and 2048 pixels per dimension");
  try { PNG.sync.read(bytes, { checkCRC: true }); } catch { fail("PNG data is damaged or unsupported"); }
  return { width, height, mime: "image/png" };
}
const identity = () => [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function multiply(a,b) {
  return Array.from({length:16}, (_,i) => { let n=0; for(let k=0;k<4;k++) n+=a[k*4+i%4]*b[Math.floor(i/4)*4+k]; return n; });
}
function nodeMatrix(node) {
  if (node.matrix !== undefined) { check(array(node.matrix,16), "Invalid node matrix"); return node.matrix; }
  const t=node.translation??[0,0,0], s=node.scale??[1,1,1], q=node.rotation??[0,0,0,1];
  check(array(t,3)&&array(s,3)&&array(q,4), "Invalid node transform");
  const len=Math.hypot(...q); check(len>1e-8, "Zero node quaternion");
  const [x,y,z,w]=q.map(v=>v/len);
  return [(1-2*y*y-2*z*z)*s[0],(2*x*y+2*w*z)*s[0],(2*x*z-2*w*y)*s[0],0,
    (2*x*y-2*w*z)*s[1],(1-2*x*x-2*z*z)*s[1],(2*y*z+2*w*x)*s[1],0,
    (2*x*z+2*w*y)*s[2],(2*y*z-2*w*x)*s[2],(1-2*x*x-2*y*y)*s[2],0,...t,1];
}
const point=(m,p)=>[0,1,2].map(i=>m[i]*p[0]+m[i+4]*p[1]+m[i+8]*p[2]+m[i+12]);

export function parseGlb(bytes) {
  check(bytes.length>=20 && bytes.readUInt32LE(0)===0x46546c67 && bytes.readUInt32LE(4)===2 && bytes.readUInt32LE(8)===bytes.length,"Expected a complete GLB 2.0 file");
  let offset=12, json=null, binary=null;
  while(offset<bytes.length) {
    check(offset+8<=bytes.length,"Truncated GLB chunk");
    const length=bytes.readUInt32LE(offset), type=bytes.readUInt32LE(offset+4); offset+=8;
    check(length%4===0 && offset+length<=bytes.length,"Invalid GLB chunk length");
    if(type===0x4e4f534a) { check(json===null&&offset===20,"JSON must be the first and only JSON chunk"); try { json=JSON.parse(bytes.subarray(offset,offset+length).toString("utf8")); } catch { fail("Invalid GLB JSON"); } }
    else if(type===0x004e4942) { check(binary===null&&json!==null,"Invalid binary chunk order"); binary=bytes.subarray(offset,offset+length); }
    offset+=length;
  }
  check(json?.asset?.version==="2.0" && binary!==null,"GLB requires version 2.0 and an embedded binary buffer");
  check(!json.extensionsRequired?.some(name=>name!=="KHR_materials_unlit"),"Required GLB extension is unsupported (including Draco/meshopt compression)");

  check(json.buffers?.length===1 && !json.buffers[0].uri && integer(json.buffers[0].byteLength,binary.length),"Only one embedded GLB buffer is supported");
  const bufferLength=json.buffers[0].byteLength;
  check(binary.length-bufferLength<=3,"Invalid GLB buffer padding");
  function view(index) {
    check(integer(index),"Invalid buffer view reference");
    const v=json.bufferViews?.[index];
    check(v && v.buffer===0 && integer(v.byteOffset??0) && integer(v.byteLength) && (v.byteOffset??0)+v.byteLength<=bufferLength,"Buffer view exceeds embedded data");
    return v;
  }
  function accessor(index, expected, attribute=false) {
    check(integer(index),"Invalid accessor reference"); const a=json.accessors?.[index];
    check(a && a.type===expected && !a.sparse && integer(a.count,150000) && a.count>0,"Unsupported or invalid accessor (sparse accessors are not supported)");
    const v=view(a.bufferView), sizes={5121:1,5123:2,5125:4,5126:4}, size=sizes[a.componentType];
    check(size && (attribute==="animation" ? a.componentType===5126 : attribute==="joints" ? [5121,5123].includes(a.componentType)&&!a.normalized : attribute ? a.componentType===5126 || (["VEC2","VEC4"].includes(expected)&&a.normalized&&[5121,5123].includes(a.componentType)) : [5121,5123,5125].includes(a.componentType)),"Unsupported accessor component type");
    const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[expected], packed=components*size, stride=v.byteStride??packed, start=(v.byteOffset??0)+(a.byteOffset??0);
    check(integer(a.byteOffset??0) && integer(stride,252) && stride>=packed && stride%size===0 && start%size===0 && (a.byteOffset??0)+(a.count-1)*stride+packed<=v.byteLength,"Accessor range or alignment is invalid");
    const result=[];
    for(let i=0;i<a.count;i++) {
      const row=[];
      for(let c=0;c<components;c++) {
        const at=start+i*stride+c*size;
        let n=a.componentType===5126?binary.readFloatLE(at):a.componentType===5125?binary.readUInt32LE(at):a.componentType===5123?binary.readUInt16LE(at):binary[at];
        if(a.normalized&&a.componentType!==5126) n/=a.componentType===5121?255:65535;
        check(Number.isFinite(n),"Non-finite vertex data"); row.push(n);
      }
      result.push(row);
    }
    return result;
  }
  const animation=json.skins?.length||json.animations?.length?animationMetadata(json,accessor,nodeMatrix,check):null;
  const bindGlobals=animation?animation.nodes.map(()=>null):null;
  function bindGlobal(n){if(bindGlobals[n])return bindGlobals[n];const node=animation.nodes[n];return bindGlobals[n]=node.parent<0?node.bindMatrix:multiply(bindGlobal(node.parent),node.bindMatrix);}
  if(animation)for(let n=0;n<animation.nodes.length;n++)check(bindGlobal(n).every(v=>Number.isFinite(v)&&Math.abs(v)<=1e6),'Animated bind hierarchy exceeds coordinate range');
  const textures=new Map();
  function texture(index) {
    if(textures.has(index)) return textures.get(index);
    const t=json.textures?.[index], img=json.images?.[t?.source];
    check(img && !img.uri && img.mimeType==="image/png","GLB textures must be embedded PNG images");
    check(textures.size<16,"GLB texture limit is 16");
    const v=view(img.bufferView), data=binary.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength);
    pngInfo(data); const encoded=`data:image/png;base64,${data.toString("base64")}`; textures.set(index,encoded); return encoded;
  }
  const primitives=[]; let vertexCount=0, visits=0;
  const minimum=[Infinity,Infinity,Infinity], maximum=[-Infinity,-Infinity,-Infinity];
  function visit(index,parent,ancestors) {
    check(integer(index)&&!ancestors.has(index)&&ancestors.size<64&&++visits<=1024,"Invalid, cyclic or excessive GLB node graph");
    const node=json.nodes?.[index]; check(node,"Missing GLB node");
    const matrix=multiply(parent,nodeMatrix(node)); check(matrix.every(Number.isFinite),"Invalid accumulated node transform");
    if(node.mesh!==undefined) {
      const mesh=json.meshes?.[node.mesh]; check(mesh&&Array.isArray(mesh.primitives),"Missing mesh");
      for(const primitive of mesh.primitives) {
        check((primitive.mode??4)===4 && !primitive.targets?.length,"Only triangle meshes without morph targets are supported");
        const positions=accessor(primitive.attributes?.POSITION,"VEC3",true);
        const indices=primitive.indices===undefined?positions.map((_,i)=>i):accessor(primitive.indices,"SCALAR").map(v=>v[0]);
        check(indices.length%3===0&&indices.every(i=>integer(i,positions.length-1)),"Invalid triangle indices");
        vertexCount+=indices.length; check(vertexCount<=150000&&primitives.length<256,"GLB exceeds 150000 expanded vertices or 256 primitives");
        const material=primitive.material===undefined?{}:json.materials?.[primitive.material]; check(material,"Missing material");
        const pbr=material.pbrMetallicRoughness??{}, color=pbr.baseColorFactor??[1,1,1,1];
        check(array(color,4)&&color.every(v=>v>=0&&v<=1),"Invalid base color");
        const metallic=pbr.metallicFactor??1,roughness=pbr.roughnessFactor??1,emissive=material.emissiveFactor??[0,0,0],alphaMode=material.alphaMode??"OPAQUE",alphaCutoff=material.alphaCutoff??.5;
        check([metallic,roughness,alphaCutoff].every(v=>Number.isFinite(v)&&v>=0&&v<=1)&&array(emissive,3)&&emissive.every(v=>v>=0&&v<=1)&&["OPAQUE","MASK","BLEND"].includes(alphaMode),"Invalid PBR material");
        const normals=primitive.attributes?.NORMAL===undefined?null:accessor(primitive.attributes.NORMAL,"VEC3",true);
        check(!normals||normals.length===positions.length&&normals.every(n=>Math.hypot(...n)>1e-8),"Invalid normal attributes");
        const tex=pbr.baseColorTexture;
        check(!tex || (tex.texCoord??0)===0,"Only TEXCOORD_0 is supported");
        const uv=tex?accessor(primitive.attributes?.TEXCOORD_0,"VEC2",true):null;
        check(!uv||uv.length===positions.length,"UV count differs from position count");
        let skinData=null;
        if(animation){
          const skin=node.skin===undefined?null:animation.skins[node.skin];check(node.skin===undefined||skin,'Invalid mesh skin');
          const joints=skin?accessor(primitive.attributes?.JOINTS_0,'VEC4','joints'):positions.map(()=>[0,0,0,0]);
          const weights=skin?accessor(primitive.attributes?.WEIGHTS_0,'VEC4',true):positions.map(()=>[1,0,0,0]);
          check(joints.length===positions.length&&weights.length===positions.length,'Skin attribute count mismatch');
          if(skin)check(joints.every(v=>v.every(j=>Number.isInteger(j)&&j>=0&&j<skin.joints.length))&&weights.every(v=>v.every(w=>w>=0)&&v.reduce((a,b)=>a+b,0)>1e-8),'Invalid skin indices/weights');
          skinData={node:index,skin:node.skin??null,vertices:[],influences:[]};
          for(let v=0;v<indices.length;v++){const n=indices[v],tri=indices.slice(Math.floor(v/3)*3,Math.floor(v/3)*3+3).map(i=>positions[i]),a=tri[1].map((x,i)=>x-tri[0][i]),b=tri[2].map((x,i)=>x-tri[0][i]),face=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=Math.hypot(...face)||1;skinData.vertices.push(...positions[n],...(normals?.[n]??face.map(x=>x/len)),...(uv?.[n]??[0,0]));const sum=weights[n].reduce((a,b)=>a+b,0);skinData.influences.push(...joints[n],...weights[n].map(w=>w/sum));}
        }
        const bindPalette=skinData?.skin!==null&&skinData?animation.skins[skinData.skin].joints.map((n,j)=>multiply(bindGlobal(n),animation.skins[skinData.skin].inverseBinds[j])):null;
        function bindPoint(expanded,index){if(!bindPalette)return point(matrix,positions[index]);const out=[0,0,0];for(let j=0;j<4;j++){const weight=skinData.influences[expanded*8+4+j];if(weight){const p=point(bindPalette[skinData.influences[expanded*8+j]],positions[index]);for(let k=0;k<3;k++)out[k]+=p[k]*weight;}}return out;}
        const output=[];
        for(let i=0;i<indices.length;i+=3) {
          const tri=indices.slice(i,i+3).map((n,j)=>bindPoint(i+j,n));
          for(const point of tri)for(let axis=0;axis<3;axis++){check(Math.abs(point[axis])<=1e6,"Mesh coordinates exceed supported range");minimum[axis]=Math.min(minimum[axis],point[axis]);maximum[axis]=Math.max(maximum[axis],point[axis]);}
          const a=tri[1].map((v,k)=>v-tri[0][k]), b=tri[2].map((v,k)=>v-tri[0][k]);
          const normal=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], length=Math.hypot(...normal)||1;
          for(let j=0;j<3;j++) {
            let n=normal.map(v=>v/length);
            if(normals){const source=normals[indices[i+j]],normalFor=matrix=>{const a=[matrix[0],matrix[1],matrix[2]],b=[matrix[4],matrix[5],matrix[6]],c=[matrix[8],matrix[9],matrix[10]],cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],A=cross(b,c),B=cross(c,a),C=cross(a,b),det=a.reduce((v,x,i)=>v+x*A[i],0);return A.map((v,i)=>(v*source[0]+B[i]*source[1]+C[i]*source[2])/det);};let value=normalFor(matrix);if(bindPalette){value=[0,0,0];for(let k=0;k<4;k++){const weight=skinData.influences[(i+j)*8+4+k];if(weight){const v=normalFor(bindPalette[skinData.influences[(i+j)*8+k]]);for(let axis=0;axis<3;axis++)value[axis]+=v[axis]*weight;}}}const length=Math.hypot(...value)||1;n=value.map(v=>v/length);}
            output.push(...tri[j],...n,...(uv?.[indices[i+j]]??[0,0]));
          }
        }
        check(output.every(Number.isFinite),"Invalid transformed geometry");
        primitives.push({ ...(skinData?{skinData}:{}), vertices: output, color, texture: tex?texture(tex.index):null, unlit: !!material.extensions?.KHR_materials_unlit, material: {metallic,roughness:Math.max(.045,roughness),emissive,alphaMode:alphaMode.toLowerCase(),alphaCutoff} });
      }
    }
    const next=new Set(ancestors);next.add(index);
    check(!node.children||Array.isArray(node.children),"Invalid node children");
    for(const child of node.children??[]) visit(child,matrix,next);
  }
  const scene=json.scenes?.[json.scene??0]; check(scene&&Array.isArray(scene.nodes),"GLB has no usable scene");
  for(const node of scene.nodes) visit(node,identity(),new Set());
  check(primitives.length>0,"GLB scene contains no triangle meshes");
  return { kind:"mesh", primitives, vertexCount, bounds:{minimum,maximum}, warnings:[],...(animation?{animation}:{}) };
}
export function decodeAsset(bytes) {
  check(bytes.length>0&&bytes.length<=ASSET_BYTES,"Asset size must be between 1 byte and 8 MiB");
  if(bytes[0]===137) return {kind:"sprite",...pngInfo(bytes),dataUrl:`data:image/png;base64,${bytes.toString("base64")}`};
  if(bytes.toString("ascii",0,4)==="RIFF")return parseWav(bytes);
  const format=advancedFormat(bytes);if(format==='obj')return parseObj(bytes);if(format==='stl')return parseStl(bytes);if(format)fail('CAD requires the bounded importer worker');
  const asset=parseGlb(bytes);
  // Exact known M9.1 generated sources only; preserve original bytes and asset IDs.
  if(['3737d9b846cfee4de5b47effe20454e1199b2c0c83d1af600c41357cf220b329','1525148a969a88bdacb7b1f13ed667b9615385d3c6ee978823650a85a237c8ed'].includes(createHash('sha256').update(bytes).digest('hex'))){for(const p of asset.primitives)for(let i=0;i<p.vertices.length;i+=24){for(let j=0;j<8;j++)[p.vertices[i+8+j],p.vertices[i+16+j]]=[p.vertices[i+16+j],p.vertices[i+8+j]];for(let v=0;v<3;v++)for(let j=3;j<6;j++)p.vertices[i+v*8+j]*=-1;}asset.warnings.push('Corrected inward normals/winding of an M9.1 built-in primitive');}
  return asset;
}
