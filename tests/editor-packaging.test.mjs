import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateEditorImports} from '../scripts/build-editor.mjs';
test('editor build rejects missing static and literal dynamic module dependencies before delivery',async t=>{const root=await mkdtemp(join(tmpdir(),'axiom-package-'));t.after(()=>rm(root,{recursive:true,force:true}));await writeFile(join(root,'chat.mjs'),"import {notify} from './notifications.mjs';\nexport const later=()=>import('./phases.mjs');");await assert.rejects(validateEditorImports(root),/AX_BUILD_0002.*notifications/);await writeFile(join(root,'notifications.mjs'),'export function notify(){}');await assert.rejects(validateEditorImports(root),/AX_BUILD_0002.*phases/);await writeFile(join(root,'phases.mjs'),'export const phases=[];');await validateEditorImports(root);});
