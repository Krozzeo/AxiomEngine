import {readFile,lstat,mkdir,writeFile,access} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {atomicJson} from 'axiom-platform/files';
import {repositoryName,branchName} from 'axiom-platform/github';

// Only the matching project's legacy preferences/receipts are adopted. Credentials are never migrated.
export async function adoptLegacyGitHub({target,legacy,projectId}){
  if(!/^project:\/\/[0-9a-f-]{36}$/.test(projectId))throw Error('Invalid legacy project identity.');
  try{await access(target);return false;}catch(e){if(e.code!=='ENOENT')throw e;}
  let source;
  try{const info=await lstat(legacy);if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||info.size>1024*1024)throw Error('Legacy GitHub settings are not an ordinary bounded file.');source=JSON.parse(await readFile(legacy,'utf8'));}catch(e){if(e.code==='ENOENT')return false;throw e;}
  if(source.version!==1||!source.configs)throw Error('Unsupported legacy GitHub settings.');
  const config=source.configs[projectId],draft=source.drafts?.[projectId];if(!config&&!draft)return false;
  const state={version:1,configs:{},drafts:{}};
  if(config){
    if(config.projectId!==projectId||!Number.isSafeInteger(config.accountId)||typeof config.autoMilestones!=='boolean'||typeof config.allowAgent!=='boolean')throw Error('Invalid legacy GitHub project configuration.');
    repositoryName(config.repository);branchName(config.branch);
    state.configs[projectId]=Object.fromEntries(['projectId','accountId','repository','branch','expectedHead','lastPublication','autoMilestones','allowAgent','observedMilestones','pending'].filter(k=>Object.hasOwn(config,k)).map(k=>[k,config[k]]));
  }
  if(draft)state.drafts[projectId]=Object.fromEntries(['newName','message','privateRepository','autoMilestones','allowAgent','mode'].filter(k=>Object.hasOwn(draft,k)).map(k=>[k,draft[k]]));
  const filename=projectId.slice(10)+'.jsonl',historySource=join(dirname(legacy),'github-history',filename),historyTarget=join(dirname(target),'github-history',filename);
  try{const info=await lstat(historySource);if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||info.size>8*1024*1024)throw Error('Legacy project history is invalid or too large.');await mkdir(dirname(historyTarget),{recursive:true});try{await writeFile(historyTarget,await readFile(historySource),{flag:'wx',mode:0o600});}catch(e){if(e.code!=='EEXIST')throw e;}}catch(e){if(e.code!=='ENOENT')throw e;}
  await atomicJson(target,state);return true;
}
