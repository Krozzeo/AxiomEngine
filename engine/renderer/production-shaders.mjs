// Native WGSL owned by Axiom. Linear HDR shading; display conversion occurs once.
export const structs=`
struct Frame { shadowVP:mat4x4f, vp:mat4x4f, camera:vec4f, environment:vec4f, params:vec4f, counts:vec4u, shadow:vec4f };
struct Instance { mvp:mat4x4f, model:mat4x4f, color:vec4f, material:vec4f, emissive:vec4f, minimum:vec4f, maximum:vec4f };
struct Light { position:vec4f, direction:vec4f, color:vec4f, options:vec4f };
@group(0) @binding(0) var<uniform> frame:Frame;
`;
export const cullShader=structs+`
@group(0) @binding(1) var<storage,read> instances:array<Instance>;
@group(0) @binding(2) var<storage,read> groups:array<vec4u>;
@group(0) @binding(3) var<storage,read_write> visible:array<u32>;
@group(0) @binding(4) var<storage,read_write> indirect:array<vec4u>;
fn admitted(item:Instance)->bool {
 var outside=vec3u(0u);var outside2=vec3u(0u);
 for(var k=0u;k<8u;k++){let p=vec3f(select(item.minimum.x,item.maximum.x,(k&1u)!=0u),select(item.minimum.y,item.maximum.y,(k&2u)!=0u),select(item.minimum.z,item.maximum.z,(k&4u)!=0u));let c=item.mvp*vec4f(p,1.0);
 outside+=vec3u(c.x < -c.w,c.y < -c.w,c.z < 0.0);outside2+=vec3u(c.x > c.w,c.y > c.w,c.z > c.w);}
 return !any(outside==vec3u(8u))&&!any(outside2==vec3u(8u));
}
@compute @workgroup_size(64) fn cs(@builtin(global_invocation_id) id:vec3u){if(id.x>=arrayLength(&groups)){return;}let g=groups[id.x];var n=0u;
 for(var i=0u;i<g.y;i++){let index=g.x+i;if(admitted(instances[index])){visible[g.x+n]=index;n++;}}
 indirect[id.x]=vec4u(g.z,n,0u,0u);
}`;
export const tilesShader=structs+`
@group(0) @binding(1) var<storage,read> lights:array<Light>;
@group(0) @binding(2) var<storage,read_write> tiles:array<u32>;
@compute @workgroup_size(64) fn cs(@builtin(global_invocation_id) id:vec3u){let nx=frame.counts.y;let ny=(frame.counts.w+15u)/16u;if(id.x>=nx*ny){return;}let tile=vec2f(f32(id.x%nx),f32(id.x/nx));var count=0u;
 for(var i=0u;i<frame.counts.x;i++){let l=lights[i];var hit=true;
 if(l.options.x>0.5){var lo=vec2f(1e20);var hi=vec2f(-1e20);var crosses=false;
 for(var k=0u;k<8u;k++){let offset=vec3f(select(-l.position.w,l.position.w,(k&1u)!=0u),select(-l.position.w,l.position.w,(k&2u)!=0u),select(-l.position.w,l.position.w,(k&4u)!=0u));let c=frame.vp*vec4f(l.position.xyz+offset,1.0);if(c.w<=0.0){crosses=true;}else{let p=(vec2f(c.x/c.w,-c.y/c.w)*0.5+0.5)*vec2f(f32(frame.counts.z),f32(frame.counts.w))/16.0;lo=min(lo,p);hi=max(hi,p);}}
 hit=crosses||all(tile+vec2f(1.0)>=lo)&&all(tile<=hi);
 }
 if(hit){tiles[id.x*65u+1u+count]=i;count++;}}
 tiles[id.x*65u]=count;
}`;
export const surfaceShader=structs+`
@group(0) @binding(1) var<storage,read> instances:array<Instance>;
@group(0) @binding(2) var<storage,read> visible:array<u32>;
@group(0) @binding(3) var<storage,read> lights:array<Light>;
@group(0) @binding(4) var<storage,read> tiles:array<u32>;
@group(0) @binding(5) var shadowMap:texture_depth_2d;
@group(0) @binding(6) var shadowSampler:sampler_comparison;
@group(1) @binding(0) var baseMap:texture_2d<f32>;
@group(1) @binding(1) var baseSampler:sampler;
@group(1) @binding(2) var<uniform> draw:vec4u;
struct Out { @builtin(position) clip:vec4f, @location(0) world:vec3f, @location(1) normal:vec3f, @location(2) uv:vec2f, @location(3) @interpolate(flat) index:u32 };
@vertex fn vs(@location(0) p:vec3f,@location(1) n:vec3f,@location(2) uv:vec2f,@builtin(instance_index) id:u32)->Out {
 let index=visible[draw.x+id];let item=instances[index];var o:Out;o.clip=item.mvp*vec4f(p,1.0);o.world=(item.model*vec4f(p,1.0)).xyz;let a=item.model[0].xyz;let b=item.model[1].xyz;let c=item.model[2].xyz;let normal=mat3x3f(cross(b,c),cross(c,a),cross(a,b))*n;let sign=select(-1.0,1.0,dot(a,cross(b,c))>=0.0);o.normal=normal/max(length(normal),1e-6)*sign;o.uv=uv;o.index=index;return o;
}
fn shadowFactor(p:vec3f)->f32 {let c=frame.shadowVP*vec4f(p,1.0);let n=c.xyz/c.w;let uv=vec2f(n.x*0.5+0.5,0.5-n.y*0.5);if(any(uv<vec2f(0.0))||any(uv>vec2f(1.0))||n.z<0.0||n.z>1.0){return 1.0;}var result=0.0;let size=f32(textureDimensions(shadowMap).x);for(var x=-1;x<=1;x++){for(var y=-1;y<=1;y++){result+=textureSampleCompareLevel(shadowMap,shadowSampler,uv+vec2f(f32(x),f32(y))/size,n.z-frame.shadow.z);}}return result/9.0;}
@fragment fn fs(o:Out)->@location(0) vec4f {
 let item=instances[o.index];let base=textureSampleLevel(baseMap,baseSampler,o.uv,0.0)*item.color;
 if(item.minimum.w>0.5&&item.minimum.w<1.5&&base.a<item.maximum.w){discard;}
 if(item.material.w>0.5){return vec4f(min(base.rgb+item.emissive.xyz,vec3f(60000.0)),base.a);}
 let n=o.normal/max(length(o.normal),1e-6);let dv=frame.camera.xyz-o.world;let v=dv/max(length(dv),1e-6);let noV=max(dot(n,v),.0001);let metallic=item.material.x;let rough=max(item.material.y,.045);let f0=mix(vec3f(.04),base.rgb,metallic);
 var rgb=base.rgb*(1.0-metallic)*frame.environment.rgb*(.5+.5*max(n.y,0.0))+f0*frame.environment.rgb*(1.0-.5*rough)+item.emissive.xyz;
 let tile=(u32(o.clip.y)/16u)*frame.counts.y+u32(o.clip.x)/16u;let tiled=frame.shadow.w>.5;let count=select(frame.counts.x,tiles[tile*65u],tiled);
 for(var j=0u;j<count;j++){let index=select(j,tiles[tile*65u+1u+j],tiled);let light=lights[index];var l=-light.direction.xyz;var attenuation=1.0;
 if(light.options.x>.5){let d=light.position.xyz-o.world;let distance=length(d);l=d/max(distance,1e-6);let cutoff=clamp(1.0-pow(distance/light.position.w,4.0),0.0,1.0);attenuation=cutoff*cutoff/max(distance*distance,.01);
 if(light.options.x>1.5){attenuation*=smoothstep(light.direction.w,light.options.y,dot(-l,light.direction.xyz));}}
 let noL=max(dot(n,l),0.0);let hv=v+l;let h=hv/max(length(hv),1e-6);let noH=max(dot(n,h),0.0);let voH=max(dot(v,h),0.0);let alpha=rough*rough;let a2=alpha*alpha;let denominator=noH*noH*(a2-1.0)+1.0;let D=a2/(3.14159265*denominator*denominator);let k=(rough+1.0)*(rough+1.0)/8.0;let G=(noV/(noV*(1.0-k)+k))*(noL/(noL*(1.0-k)+k));let F=f0+(vec3f(1.0)-f0)*pow(1.0-voH,5.0);let specular=D*G*F/max(4.0*noV*noL,.0001);let diffuse=(vec3f(1.0)-F)*(1.0-metallic)*base.rgb/3.14159265;
 let visibility=select(1.0,shadowFactor(o.world),f32(index+1u)==frame.shadow.x);rgb+=(diffuse+specular)*light.color.rgb*light.color.w*attenuation*noL*visibility;
 }
 return vec4f(clamp(rgb,vec3f(0.0),vec3f(60000.0)),base.a);
}`;
export const shadowShader=structs+`
@group(0) @binding(1) var<storage,read> instances:array<Instance>;
@group(1) @binding(0) var baseMap:texture_2d<f32>;
@group(1) @binding(1) var baseSampler:sampler;
@group(1) @binding(2) var<uniform> draw:vec4u;
struct Out { @builtin(position) clip:vec4f, @location(0) uv:vec2f, @location(1) @interpolate(flat) index:u32 };
@vertex fn vs(@location(0) p:vec3f,@location(2) uv:vec2f,@builtin(instance_index) id:u32)->Out {let index=draw.x+id;let item=instances[index];var o:Out;o.clip=frame.shadowVP*item.model*vec4f(p,1.0);if(item.emissive.w<.5){o.clip=vec4f(2.0,2.0,2.0,1.0);}o.uv=uv;o.index=index;return o;}
@fragment fn fs(o:Out){let i=instances[o.index];if(i.minimum.w>1.5){discard;}if(i.minimum.w>.5&&textureSampleLevel(baseMap,baseSampler,o.uv,0.0).a*i.color.a<i.maximum.w){discard;}}
`;
export const postShader=structs+`
@group(0) @binding(1) var hdr:texture_2d<f32>;
@group(0) @binding(2) var bloom:texture_2d<f32>;
@group(0) @binding(3) var linearSampler:sampler;
struct Out { @builtin(position) p:vec4f, @location(0) uv:vec2f };
@vertex fn vs(@builtin(vertex_index) i:u32)->Out{let p=array<vec2f,3>(vec2f(-1.0,-1.0),vec2f(3.0,-1.0),vec2f(-1.0,3.0));var o:Out;o.p=vec4f(p[i],0.0,1.0);o.uv=vec2f(p[i].x*.5+.5,.5-p[i].y*.5);return o;}
fn sampleHdr(uv:vec2f)->vec3f{return textureSampleLevel(hdr,linearSampler,uv,0.0).rgb;}
@fragment fn bright(o:Out)->@location(0) vec4f {let texel=1.0/vec2f(textureDimensions(hdr));var value=vec3f(0.0);for(var x=-2;x<=2;x++){for(var y=-2;y<=2;y++){value+=max(sampleHdr(o.uv+vec2f(f32(x),f32(y))*texel*2.0)-vec3f(1.0),vec3f(0.0));}}return vec4f(value/25.0,1.0);}
fn tone(value:vec3f)->vec3f{let x=value*frame.params.x;var rgb=x;if(frame.params.y>.5&&frame.params.y<1.5){rgb=clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),vec3f(0.0),vec3f(1.0));}else if(frame.params.y>1.5){rgb=x/(vec3f(1.0)+x);}return pow(clamp(rgb,vec3f(0.0),vec3f(1.0)),vec3f(1.0/2.2));}
fn composite(uv:vec2f)->vec3f{return tone(sampleHdr(uv)+textureSampleLevel(bloom,linearSampler,uv,0.0).rgb*frame.params.z);}
@fragment fn fs(o:Out)->@location(0) vec4f{let center=composite(o.uv);if(frame.params.w<.5){return vec4f(center,1.0);}let texel=1.0/vec2f(textureDimensions(hdr));let north=composite(o.uv+vec2f(0.0,-texel.y));let south=composite(o.uv+vec2f(0.0,texel.y));let east=composite(o.uv+vec2f(texel.x,0.0));let west=composite(o.uv+vec2f(-texel.x,0.0));let weights=vec3f(.299,.587,.114);let lum=dot(center,weights);let low=min(lum,min(min(dot(north,weights),dot(south,weights)),min(dot(east,weights),dot(west,weights))));let high=max(lum,max(max(dot(north,weights),dot(south,weights)),max(dot(east,weights),dot(west,weights))));let blend=select(0.0,.5,high-low>max(.0312,high*.125));return vec4f(mix(center,(north+south+east+west)*.25,blend),1.0);}
`;
