import {createHash} from 'node:crypto';
import {TaskJournal} from 'axiom-platform/ai/journal';
import {join} from 'node:path';
import {projectPath,projectFiles} from '../../../engine/scene/project-files.mjs';
export const hash=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
export const workError=(message,code='AX_AI_WORK_BLOCKED')=>Object.assign(Error(message),{code});
export const workSchemas={
 'work.plan':{type:'object',additionalProperties:false,properties:{mode:{type:'string',enum:['discussion','authoring','diagnosis','milestone']},milestoneId:{type:'string',maxLength:80},steps:{type:'array',maxItems:32,items:{type:'object',additionalProperties:false,properties:{id:{type:'string',pattern:'^[a-zA-Z0-9_-]{1,40}$'},title:{type:'string',minLength:1,maxLength:240},domains:{type:'array',maxItems:3,items:{type:'string',enum:['scene','scripting','physics','lighting','audio','animation','ui2d','files','pmd','diagnostics']}},dependsOn:{type:'array',maxItems:32,items:{type:'string'}},checks:{type:'array',minItems:1,maxItems:16,items:{type:'object',additionalProperties:false,properties:{kind:{type:'string',enum:['entity','file','file-exists','file-contains','file-hash','script-assigned','compile','runtime','pmd']},selector:{type:'string',maxLength:256},property:{type:'string',maxLength:128},expected:{},contains:{type:'string',maxLength:2000}},required:['kind']}}},required:['id','title','checks']}}},required:['mode','steps']},
 'work.block':{type:'object',additionalProperties:false,properties:{reason:{type:'string',minLength:1,maxLength:1000},nextAction:{type:'string',minLength:1,maxLength:1000}},required:['reason','nextAction']},
 'work.evidence.read':{type:'object',additionalProperties:false,properties:{taskId:{type:'string'},sequence:{type:'integer',minimum:1},offset:{type:'integer',minimum:0},maxCharacters:{type:'integer',minimum:1,maximum:6000}},required:['taskId','sequence']},
 'work.status':{type:'object',properties:{},additionalProperties:false},
 'work.check':{type:'object',additionalProperties:false,properties:{stepId:{type:'string'}},required:['stepId']},
 'project.file.patch':{type:'object',additionalProperties:false,properties:{path:{type:'string'},expectedHash:{type:'string',pattern:'^[a-f0-9]{64}$'},edits:{type:'array',minItems:1,maxItems:16,items:{type:'object',properties:{oldText:{type:'string',minLength:1,maxLength:24000},newText:{type:'string',maxLength:24000}},required:['oldText','newText'],additionalProperties:false}}},required:['path','expectedHash','edits']},
 'context.read':{type:'object',additionalProperties:false,properties:{attachmentId:{type:'string'},offset:{type:'integer',minimum:0},maxCharacters:{type:'integer',minimum:1,maximum:6000}},required:['attachmentId']},
 'project.master.transition':{type:'object',additionalProperties:false,properties:{action:{type:'string',enum:['approve-definition','approve-plan','request-critique','skip-critique','finish-critique','finish','revisit','revisit-definition','revisit-planning']},userQuote:{type:'string',minLength:1,maxLength:1000},revision:{type:'integer',minimum:1}},required:['action','userQuote','revision']},
 'scene.dimension.convert':{type:'object',additionalProperties:false,properties:{dimension:{type:'integer',enum:[2,3]},dryRun:{type:'boolean'},removeIncompatible:{type:'boolean'}},required:['dimension','dryRun']}
};
export const entitySelector=value=>typeof value==='string'&&value.startsWith('name:')?value.slice(5):value;
const componentNames=['transform','renderable','material','collider','rigidBody','camera','light','sprite2D','light2D','audioSource','audioListener','animator','ui2D','scriptComponents','particleSystem','particles2D','spriteAnimation','tilemap','lod'];
const propertyPath=path=>{const parts=path.split('.');return parts.map((part,index)=>index===0?({Transform:'transform',Material:'material',Collider:'collider',RigidBody:'rigidBody',Camera:'camera',Light:'light',script:'scriptComponents',Script:'scriptComponents'}[part]??part):index===1?({Position:'position',Rotation:'rotation',Scale:'scale'}[part]??part):index===2&&['position','rotation','scale'].includes(parts[1].toLowerCase())?({x:'0',y:'1',z:'2',w:'3',X:'0',Y:'1',Z:'2',W:'3'}[part]??part):part).join('.');};
export function validateChecks(checks,project){
 for(const c of checks){
  if(c.kind==='script-assigned'&&(typeof c.selector!=='string'||typeof c.expected!=='string'||!c.expected.endsWith('.cs')))throw workError('Script assignment needs an entity selector and expected physical .cs path.');
  if(c.kind==='file'){
   try{projectPath(c.selector);}catch{throw workError('File check needs a portable project path, for example Scripts/WorkshopMotion.cs.');}
   if(typeof c.selector!=='string'||!c.selector||/\\\\|(?:^|\/)\.\.(?:\/|$)|\/$/.test(c.selector)||['Assets','Scripts','Scenes'].includes(c.selector)||projectFiles(project?.scene??{}).some(f=>f.path===c.selector&&f.kind==='folder'))throw workError('File check needs a file path, not a directory: '+c.selector+'. Use Scripts/WorkshopMotion.cs.');
   if(c.expected!==undefined&&typeof c.expected!=='boolean'&&!(typeof c.expected==='string'&&/^[a-f0-9]{64}$/.test(c.expected)))throw workError('File expected must be an existence boolean or an exact SHA-256 hash; contains checks compare text independently.');
   if(c.contains!==undefined&&(typeof c.contains!=='string'||!c.contains))throw workError('File contains requires nonempty case-sensitive text.');
  }
  if(c.kind==='entity'&&(!['id','name','parentId','prefab',...componentNames].includes(c.property?.split('.')[0])||c.property.split('.').some(v=>['__proto__','prototype','constructor'].includes(v))))throw workError('Unknown entity check path '+c.property+'. Use authored component paths; scripts use scriptComponents.');
 }
}
const get=(value,path)=>{let next=value;for(const part of (path??'').split('.').filter(Boolean)){if(['__proto__','constructor','prototype'].includes(part)||next==null||!Object.hasOwn(next,part))return undefined;next=next[part];}return next;};
export function setPlan(previous,args,project){
 args={...args,steps:args.steps.map(s=>({...s,checks:s.checks.map(c=>{if(c.kind==='file-hash'&&!(typeof c.expected==='string'&&/^[a-f0-9]{64}$/.test(c.expected)))throw workError('file-hash requires an exact SHA-256 string');if(c.kind==='file-contains'&&typeof c.contains!=='string')throw workError('file-contains requires text');if(c.kind==='file-exists'&&c.expected!==undefined&&typeof c.expected!=='boolean')throw workError('file-exists requires an existence boolean');if(c.kind.startsWith('file-'))c={...c,kind:'file',...(c.kind==='file-exists'?{expected:c.expected??true}:{})};if(['entity','script-assigned'].includes(c.kind))c={...c,selector:entitySelector(c.selector)};return c.kind==='entity'?{...c,property:propertyPath(c.property??'')}:c;})}))};
 if(args.mode!=='discussion'&&!args.steps.length)throw workError('Implementation needs concrete deliverables and checks');
 for(const step of args.steps)validateChecks(step.checks,project);
 const ids=new Set(args.steps.map(x=>x.id));if(ids.size!==args.steps.length)throw workError('Duplicate work step');
 for(const s of args.steps){for(const id of s.dependsOn??[])if(!ids.has(id)||id===s.id)throw workError('Invalid work dependency');for(const c of s.checks){if(['entity','file'].includes(c.kind)&&!c.selector)throw workError('Check requires a real entity/file selector');if(c.kind==='entity'&&!c.property)throw workError('Entity checks need a property and expected value');if(['entity','pmd'].includes(c.kind)&&!Object.hasOwn(c,'expected'))throw workError('Check needs an expected value');}}
 const visit=(id,path=new Set())=>{if(path.has(id))throw workError('Cyclic work plan');for(const d of args.steps.find(x=>x.id===id).dependsOn??[])visit(d,new Set([...path,id]));};for(const id of ids)visit(id);
 // Replanning cannot erase verified deliverables or quietly relax their checks.
 if(previous)for(const old of previous.steps.filter(s=>s.status==='verified')){const next=args.steps.find(x=>x.id===old.id);if(!next||hash(old.checks)!==hash(next.checks))throw workError('Retain existing acceptance checks; add a repair step instead of removing requirements');}
 return {...args,steps:args.steps.map(s=>({...s,checks:s.checks.map(c=>c.kind==='entity'?{...c,property:propertyPath(c.property)}:c),dependsOn:s.dependsOn??[],status:previous?.steps.find(x=>x.id===s.id)?.status??'todo',evidence:null}))};
}
export function checkStep(plan,id,project,{compilation,runtime}={}){
 const step=plan.steps.find(s=>s.id===id);if(!step)throw workError('Work step is unavailable');
 if(step.dependsOn.some(id=>plan.steps.find(s=>s.id===id).status!=='verified'))throw workError('Verify prerequisite steps first');
 const results=step.checks.map(c=>{
  let actual,ok=false;
  if(c.kind==='entity'){const matches=project.scene.entities.filter(e=>e.id===entitySelector(c.selector)||e.name===entitySelector(c.selector));if(matches.length===1)actual=get(matches[0],c.property);if(matches.length===1&&[...componentNames,'prefab'].includes(c.property)&&typeof c.expected==='boolean')actual=actual!==undefined;ok=matches.length===1&&JSON.stringify(actual)===JSON.stringify(c.expected);}
  if(c.kind==='file'){const f=projectFiles(project.scene).find(f=>f.path===c.selector&&f.kind!=='folder');const exists=!!f,contentMatches=c.contains===undefined||exists&&(f.text??'').includes(c.contains),fileHash=f?hash(f.text??''):null;actual=typeof c.expected==='boolean'?exists:fileHash;ok=(typeof c.expected==='boolean'?exists===c.expected:exists&&(c.expected===undefined||fileHash===c.expected))&&contentMatches;return {...c,actual,predicates:{exists,contentMatches,hash:fileHash,hashMatches:typeof c.expected==='string'?fileHash===c.expected:null},passed:ok,...(!ok?{reason:!exists?'File is missing':!contentMatches?'Case-sensitive content is missing':'File hash/existence differs',repair:!exists?'Create the planned file or correct the file path':'Read this file once and correct its contents or the invalid predicate; do not recompile unchanged code'}:{})};}
  if(c.kind==='script-assigned'){const entities=project.scene.entities.filter(e=>e.id===entitySelector(c.selector)||e.name===entitySelector(c.selector));actual=entities.length===1?entities[0].scriptComponents?.map(v=>v.path)??[]:null;ok=entities.length===1&&actual.includes(c.expected)&&projectFiles(project.scene).some(f=>f.path===c.expected&&f.kind==='script');}
  if(c.kind==='compile'){actual=compilation?.status;ok=actual==='completed'&&compilation.sourceHash===hash(projectFiles(project.scene).filter(f=>f.kind==='script').map(f=>[f.path,f.text]).sort((a,b)=>a[0].localeCompare(b[0])));}
  if(c.kind==='runtime'){actual=runtime?.status;ok=actual==='completed'&&runtime.verified===true;}
  if(c.kind==='pmd'){actual=get(project.editor?.pmd,c.property);ok=JSON.stringify(actual)===JSON.stringify(c.expected);}
  return {...c,actual:actual??null,passed:ok,...(!ok?{reason:c.kind==='compile'?'No successful compilation of current sources':c.kind==='runtime'?'No current verified runtime assertions':'Authored value differs or selector is missing/ambiguous'}:{})};
 });
 step.status=results.every(x=>x.passed)?'verified':'todo';step.evidence={projectHash:hash(project),results};return {stepId:id,status:step.status,results};
}
export function workPacket(s){return {objective:s.public.originalObjective,taskId:s.public.id,previousTaskId:s.public.resumedFrom??null,plan:s.plan??null,receipts:s.receipts??[],blockers:s.blockers??[],compilation:s.lastCompilation??null,resources:s.resources??{},nextStep:s.plan?.steps.find(x=>x.status!=='verified')?.id??null,cumulative:s.cumulative};}
export function noteFailure(s,name,error,preconditions,args={}){
 s.failureCounts??={};const key=hash([name,error.code??'',String(error.message).replace(/entity:\/\/[a-f0-9-]+|workspace:\/\/[a-f0-9-]+/g,'<identity>'),preconditions]);const count=(s.failureCounts[key]??0)+1;s.failureCounts[key]=count;
 s.blockers??=[];s.blockers.push({tool:name,code:error.code??'AX_AI_0001',message:error.message,preconditions,arguments:args,count});if(s.blockers.length>12)s.blockers.shift();
 if(count>=3)throw workError('Repeated failure with unchanged relevant preconditions: '+error.message,'AX_AI_NO_PROGRESS');return count;
}
export class WorkOrderStore{
 constructor(root){this.root=root;this.journal=new TaskJournal(root);}
 async load(){return this.journal.load();}
 async save(s){const value={version:1,createdAt:s.createdAt,public:s.public,sourceId:s.sourceId,sourceRevision:s.sourceRevision,initialScriptHash:s.initialScriptHash,plan:s.plan,receipts:s.receipts??[],resources:s.resources??{},blockers:s.blockers??[],failureCounts:s.failureCounts??{},cumulative:s.cumulative,contracts:[...(s.contracts??[])],requireConfirmation:s.requireConfirmation??true,approvalGranted:s.approvalGranted??false,taskPlan:s.taskPlan??null,input:s.input??[],pendingCalls:s.pendingCalls??[],batchState:s.batchState??{},pendingOperation:s.pendingOperation??null,lastCompilation:s.lastCompilation??null,compilationRequested:s.compilationRequested??false,attachmentIds:s.attachmentIds??[],runtimeEvidence:s.runtimeEvidence??null,stepTokensStart:s.stepTokensStart??0,approvalEvents:s.approvalEvents??[],progress:s.progress??null};
  await this.journal.save(value);
 }
}
