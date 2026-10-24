import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {adoptLegacyGitHub} from '../platform/github-state.mjs';
test('P2 adopts only this project legacy GitHub destination/preferences/history and preserves the source',async t=>{
  const root=await mkdtemp(join(tmpdir(),'axiom-p2-legacy-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const id='project://'+randomUUID(),other='project://'+randomUUID(),legacy=join(root,'old','github-session.json'),target=join(root,'new','github.json');await mkdir(dirname(legacy));
  const config={projectId:id,accountId:42,repository:'fixture/game',branch:'main',expectedHead:'1'.repeat(40),autoMilestones:false,allowAgent:false,observedMilestones:[]};
  const bytes=JSON.stringify({version:1,configs:{[id]:config,[other]:{...config,projectId:other}},drafts:{[id]:{mode:'existing',token:'not-a-valid-setting'}}});await writeFile(legacy,bytes);
  await mkdir(join(dirname(legacy),'github-history'));await writeFile(join(dirname(legacy),'github-history',id.slice(10)+'.jsonl'),'{}\n');
  assert.equal(await adoptLegacyGitHub({target,legacy,projectId:id}),true);
  const state=JSON.parse(await readFile(target,'utf8'));assert.deepEqual(Object.keys(state.configs),[id]);assert.equal(state.configs[id].autoMilestones,false);assert.equal(state.configs[id].allowAgent,false);assert.equal(JSON.stringify(state).includes('token'),false);
  assert.equal(await readFile(legacy,'utf8'),bytes);assert.equal(await readFile(join(dirname(target),'github-history',id.slice(10)+'.jsonl'),'utf8'),'{}\n');
  assert.equal(await adoptLegacyGitHub({target,legacy,projectId:id}),false);
});
