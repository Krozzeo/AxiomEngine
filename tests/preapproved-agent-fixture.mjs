import {OpenAiAssistant} from '../daemon/bootstrap/agent/openai-assistant.mjs';
// Legacy deterministic browser/benchmark schedules exercise execution after a
// human-approved plan. Approval itself is covered by the 0.0.45 tests without
// this fixture. This helper is never imported by production code.
export function installPreapprovedAgentFixture(){
 const start=OpenAiAssistant.prototype.start;
 OpenAiAssistant.prototype.start=function(data){const task=start.call(this,{...data,requireConfirmation:false});const order=this.sessions.get(task.id);order.taskPlan=['Execute the test scenario already authorized by this acceptance fixture'];order.approvalGranted=true;return task;};
}
