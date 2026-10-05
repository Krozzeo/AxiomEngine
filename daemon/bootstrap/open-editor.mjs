import {spawn} from 'node:child_process';
export function openEditor(url, {platform=process.platform, launch=spawn}={}) {
  const parsed=new URL(url);
  if(parsed.protocol!=='http:'||parsed.hostname!=='127.0.0.1')throw Error('Expected local editor URL');
  const command=platform==='win32'?'rundll32.exe':platform==='darwin'?'open':'xdg-open';
  const args=platform==='win32'?['url.dll,FileProtocolHandler',url]:[url];
  return new Promise(resolve=>{
    try {const child=launch(command,args,{shell:false,stdio:'ignore'});
      child.once('error',()=>resolve(false));child.once('exit',code=>resolve(code===0));
    } catch {resolve(false);}
  });
}
