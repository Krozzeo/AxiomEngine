// Editor camera and interaction math. Runtime transforms/physics remain in Rust.
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,s)=>a.map(v=>v*s);
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const length=a=>Math.hypot(...a);
export const unit=a=>mul(a,1/(length(a)||1));
export function matrixMultiply(a,b){return Array.from({length:16},(_,i)=>{const r=i%4,c=Math.floor(i/4);return [0,1,2,3].reduce((s,k)=>s+a[k*4+r]*b[c*4+k],0);});}
export function transform(m,p,w=1){return [0,1,2,3].map(r=>m[r]*p[0]+m[4+r]*p[1]+m[8+r]*p[2]+m[12+r]*w);}
export function quaternionMultiply(a,b){const [x,y,z,w]=a,[X,Y,Z,W]=b;return [w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W,w*W-x*X-y*Y-z*Z];}
export function axisQuaternion(axis,angle){return [...mul(unit(axis),Math.sin(angle/2)),Math.cos(angle/2)];}
export function modelMatrix(t){const [x,y,z,w]=t.rotation??[0,0,0,1],[sx,sy,sz]=t.scale;return [(1-2*(y*y+z*z))*sx,2*(x*y+z*w)*sx,2*(x*z-y*w)*sx,0,2*(x*y-z*w)*sy,(1-2*(x*x+z*z))*sy,2*(y*z+x*w)*sy,0,2*(x*z+y*w)*sz,2*(y*z-x*w)*sz,(1-2*(x*x+y*y))*sz,0,...t.position,1];}
export function basis(camera){const forward=unit(sub(camera.target,camera.position)),up=camera.up??[0,1,0];let right=unit(cross(forward,up));if(length(right)<.5)right=unit(cross(forward,[0,0,1]));return {forward,right,up:unit(cross(right,forward))};}
export function cameraMatrix(c,aspect){const {forward:f,right:r,up:u}=basis(c),p=c.position;
 const view=[r[0],u[0],-f[0],0,r[1],u[1],-f[1],0,r[2],u[2],-f[2],0,-dot(r,p),-dot(u,p),dot(f,p),1];
 const near=.01,far=10000;let projection;
 if(c.projection==='orthographic'){const h=c.orthoHeight??6;projection=[2/(h*aspect),0,0,0,0,2/h,0,0,0,0,1/(near-far),0,0,0,near/(near-far),1];}
 else{const v=1/Math.tan((c.fov??60)*Math.PI/360);projection=[v/aspect,0,0,0,0,v,0,0,0,0,far/(near-far),-1,0,0,near*far/(near-far),0];}
 return matrixMultiply(projection,view);
}
export function projectPoint(p,c,width,height){const v=transform(cameraMatrix(c,width/height),p);if(v[3]<=0)return null;return [(v[0]/v[3]+1)*width/2,(1-v[1]/v[3])*height/2,v[2]/v[3]];}
export function cameraRay(x,y,c,width,height){const {forward,right,up}=basis(c),nx=2*x/width-1,ny=1-2*y/height,aspect=width/height;
 if(c.projection==='orthographic')return {origin:add(c.position,add(mul(right,nx*c.orthoHeight*aspect/2),mul(up,ny*c.orthoHeight/2))),direction:forward};
 const tan=Math.tan(c.fov*Math.PI/360);return {origin:c.position,direction:unit(add(forward,add(mul(right,nx*tan*aspect),mul(up,ny*tan))))};
}
export function rayTriangle(ray,a,b,c){const e1=sub(b,a),e2=sub(c,a),h=cross(ray.direction,e2),det=dot(e1,h);if(Math.abs(det)<1e-9)return null;const s=sub(ray.origin,a),u=dot(s,h)/det;if(u<0||u>1)return null;const q=cross(s,e1),v=dot(ray.direction,q)/det;if(v<0||u+v>1)return null;const t=dot(e2,q)/det;return t>=0?t:null;}
export function pickGeometry(ray,draws){let best=null;for(const draw of draws){const m=draw.model??modelMatrix(draw.transform);for(let i=0;i<draw.vertices.length;i+=24){const points=[0,8,16].map(j=>transform(m,draw.vertices.slice(i+j,i+j+3)).slice(0,3)),distance=rayTriangle(ray,...points);if(distance!==null&&(!best||distance<best.distance))best={entityId:draw.entityId,distance};}}return best?.entityId??null;}
export function collapsedGeometry(draw){const m=draw.model??modelMatrix(draw.transform);for(let i=0;i<draw.vertices.length;i+=24){const [a,b,c]=[0,8,16].map(j=>transform(m,draw.vertices.slice(i+j,i+j+3)).slice(0,3));if(length(cross(sub(b,a),sub(c,a)))>1e-10)return false;}return true;}
export function clipVisible(draw,camera,aspect){const mvp=draw.mvp??matrixMultiply(cameraMatrix(camera,aspect),draw.model??modelMatrix(draw.transform)),points=[];for(let i=0;i<draw.vertices.length;i+=8)points.push(transform(mvp,draw.vertices.slice(i,i+3)));if(!points.length)return false;
 return ![v=>v[0]<-v[3],v=>v[0]>v[3],v=>v[1]<-v[3],v=>v[1]>v[3],v=>v[2]<0,v=>v[2]>v[3]].some(outside=>points.every(outside));
}
export function frameCamera(camera,entity){const radius=Math.max(.5,...entity.transform.scale.map(Math.abs))*2,direction=unit(sub(camera.position,camera.target));return {...camera,target:[...entity.transform.position],position:add(entity.transform.position,mul(direction,radius*3)),orthoHeight:radius*3};}
export function quaternionFromEuler(degrees){const [x,y,z]=degrees.map(d=>d*Math.PI/180);return quaternionMultiply(quaternionMultiply(axisQuaternion([0,0,1],z),axisQuaternion([0,1,0],y)),axisQuaternion([1,0,0],x));}
export function eulerFromQuaternion(q){const [x,y,z,w]=q.map(v=>v/Math.hypot(...q));return [Math.atan2(2*(w*x+y*z),1-2*(x*x+y*y)),Math.asin(Math.max(-1,Math.min(1,2*(w*y-z*x)))),Math.atan2(2*(w*z+x*y),1-2*(y*y+z*z))].map(r=>r*180/Math.PI);}
export function rotationDragAngle(start,end,center,axis,camera,width,height){const intersect=p=>{const ray=cameraRay(...p,camera,width,height),d=dot(ray.direction,axis);if(Math.abs(d)<1e-4)return null;const t=dot(sub(center,ray.origin),axis)/d;if(t<0)return null;return sub(add(ray.origin,mul(ray.direction,t)),center);};const a=intersect(start),b=intersect(end);if(a&&b&&length(a)>1e-5&&length(b)>1e-5)return Math.atan2(dot(axis,cross(unit(a),unit(b))),dot(unit(a),unit(b)));const c=projectPoint(center,camera,width,height);if(!c)return 0;const screenAngle=Math.atan2(end[1]-c[1],end[0]-c[0])-Math.atan2(start[1]-c[1],start[0]-c[0]);return Math.atan2(Math.sin(screenAngle),Math.cos(screenAngle))*(dot(axis,basis(camera).forward)>=0?1:-1);}
export function orbitCamera(camera,dx,dy){const b=basis(camera),offset=sub(camera.position,camera.target),yaw=-dx*.005,pitch=-dy*.005,turn=quaternionMultiply(axisQuaternion([0,1,0],yaw),axisQuaternion(b.right,pitch)),rotated=transform(modelMatrix({position:[0,0,0],rotation:turn,scale:[1,1,1]}),offset,0).slice(0,3);return {...camera,position:add(camera.target,rotated),up:[0,1,0]};}
