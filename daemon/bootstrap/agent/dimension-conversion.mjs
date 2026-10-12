import {twoDDefaults} from '../../../engine/renderer/two-d-plan.mjs';
import {renderingDefaults} from '../../../engine/renderer/render-plan.mjs';
import {validateProject} from '../../../protocol/src/project-document.mjs';
import {workError} from './work-orders.mjs';
const twoDComponents=['sprite2D','spriteAnimation','tilemap','light2D','particles2D','ui2D'];
export function dimensionPlan(project,dimension){
 const items=[];for(const e of project.scene.entities){const keys=dimension===2?(e.renderable?.kind==='mesh'?['renderable','lod','animator']:[]):twoDComponents.filter(k=>e[k]);if(keys.length)items.push({entityId:e.id,name:e.name,remove:keys,locked:!!e.prefab});}
 return {dimension,current:project.scene.twoD?2:3,removeRendering:dimension===2&&!!project.scene.rendering,components:items,cameras:project.scene.entities.filter(e=>e.camera).map(e=>({id:e.id,projection:dimension===2?'orthographic':'perspective'})),blocked:items.some(x=>x.locked),keepsEntitiesAndFiles:true};
}
export function convertDimension(project,args){
 const plan=dimensionPlan(project,args.dimension);if(args.dryRun)return {plan};
 if(plan.blocked)throw workError('Disassemble incompatible linked prefabs before converting');
 if((plan.removeRendering||plan.components.length)&&args.removeIncompatible!==true)throw workError('Inspect dryRun and explicitly request removal of the listed incompatible components');
 const next=structuredClone(project),scene=next.scene;
 for(const item of plan.components){const e=scene.entities.find(e=>e.id===item.entityId);for(const key of item.remove)delete e[key];}
 if(args.dimension===2){delete scene.rendering;scene.twoD=structuredClone(twoDDefaults);for(const e of scene.entities){if(e.camera){e.camera.projection='orthographic';if(e.camera.active){e.transform.position=[0,0,10];e.transform.rotation=[0,0,0,1];}}}if(scene.cameraMode!=='entities')scene.camera={position:[0,0,10],target:[0,0,0],fov:60,orthoHeight:6,projection:'orthographic'};}
 else {delete scene.twoD;scene.rendering=structuredClone(renderingDefaults);for(const e of scene.entities)if(e.camera)e.camera.projection='perspective';if(scene.cameraMode!=='entities')scene.camera={position:[0,0,6],target:[0,0,0],fov:60,orthoHeight:6,projection:'perspective'};}
 validateProject(next);return {project:next,plan};
}
