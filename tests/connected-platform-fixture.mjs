import {OpenAiProvider} from 'axiom-platform/ai/provider';
// Controlled provider injection for domain tests; production HTTP cannot connect accounts.
export function connectedPlatformFixture(fetchImpl){
 const provider=new OpenAiProvider({fetchImpl,key:'sk-controlled-platform-fixture'});
 return {shared:true,state:{connected:true,hasCredential:true,epoch:0,defaults:{model:'gpt-4.1',reasoning:'default'}},get key(){return this.state.hasCredential?'platform-session':'';},set key(value){},request(path,options){return provider.request(path,{...options,key:provider.key});}};
}
export async function openHostedAssistant(page){
 await page.waitForFunction(()=>!document.querySelector('#ai-indicator').classList.contains('disconnected'));
 if(!await page.locator('#ai-assistant-content').isVisible())await page.locator('#ai-indicator').click();
 await page.locator('#ai-assistant-content').waitFor({state:'visible'});
}
