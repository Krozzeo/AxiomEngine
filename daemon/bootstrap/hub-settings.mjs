import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
export function documentsFolder({platform=process.platform,home=homedir(),env=process.env,run=execFileSync}={}){
 if(platform==='win32'){try{const path=run('powershell.exe',['-NoProfile','-NonInteractive','-Command','[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); [Environment]::GetFolderPath("MyDocuments")'],{encoding:'utf8',windowsHide:true,timeout:5000}).trim();if(path)return path;}catch{}}
 return env.XDG_DOCUMENTS_DIR?.replace('$HOME',home)??join(home,'Documents');
}
export class HubSettings {
 constructor({settingsRoot,defaultRoot}={}){this.settingsRoot=settingsRoot??join(process.env.APPDATA??join(homedir(),'.config'),'Axiom');this.defaultRoot=defaultRoot??join(documentsFolder(),'Axiom');this.filename=join(this.settingsRoot,'hub.json');}
 async load(){try{const s=JSON.parse(await readFile(this.filename,'utf8'));if(typeof s.projectRoot!=='string'||!s.projectRoot.trim())throw Error('Invalid Hub settings');return {projectRoot:resolve(s.projectRoot)};}catch(e){if(e.code!=='ENOENT')throw e;return {projectRoot:resolve(this.defaultRoot)};}}
 async save(projectRoot){if(typeof projectRoot!=='string'||!projectRoot.trim()||projectRoot.length>1024)throw Error('Enter a valid project storage path');const settings={projectRoot:resolve(projectRoot)};await mkdir(this.settingsRoot,{recursive:true});await writeFile(this.filename+'.tmp',JSON.stringify(settings)+'\n',{mode:0o600});await rename(this.filename+'.tmp',this.filename);return settings;}
}
export const axiomApplications=[{id:'game-engine',name:'Game Engine',available:true},{id:'cad',name:'CAD modelling',available:false},{id:'structural-simulation',name:'Structural simulation',available:false},{id:'animation',name:'3D animation',available:false}];
