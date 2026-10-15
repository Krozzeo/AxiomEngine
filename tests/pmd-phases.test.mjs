import test from 'node:test';
import assert from 'node:assert/strict';
import {pmdPhaseStates} from '../apps/editor/src/pmd-phases.mjs';
test('PMD visual phases derive from actual persisted state, including completion and backtracking',()=>{assert.deepEqual(pmdPhaseStates({phase:'critique'}).map(s=>s.state),['complete','complete','current','pending']);assert.ok(pmdPhaseStates({phase:'ready'}).every(s=>s.state==='complete'));assert.deepEqual(pmdPhaseStates({phase:'definition'}).map(s=>s.state),['current','pending','pending','pending']);assert.ok(pmdPhaseStates(null).every(s=>s.state==='pending'));});
