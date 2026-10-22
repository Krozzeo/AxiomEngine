import {chromium} from 'playwright';
export function browserOptions(options={},platform=process.platform,env=process.env){
 const args=[...(options.args??[])];
 // Linux's forced SwiftShader/Vulkan combination can prevent both D3D and WARP
 // adapters on Windows. Keep GPU assertions; use the OS-supported backend.
 const chosen=platform==='win32'?args.filter(a=>!['--enable-features=Vulkan','--use-angle=vulkan','--use-vulkan=swiftshader','--use-webgpu-adapter=swiftshader','--disable-vulkan-surface'].includes(a)):args;
 if(chosen.includes('--enable-unsafe-webgpu')&&!chosen.includes('--enable-gpu'))chosen.push('--enable-gpu');
 return {...options,channel:options.channel??'chromium',...(['true','false'].includes(env.AXIOM_HEADLESS)?{headless:env.AXIOM_HEADLESS!=='false'}:{}),args:chosen};
}
export function launchEditorBrowser(options){return chromium.launch(browserOptions(options));}
