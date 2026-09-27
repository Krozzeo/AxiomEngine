import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,dirname,extname} from 'node:path';
import {gzipSync} from 'node:zlib';
import {chromium} from 'playwright';
const output=resolve('.axiom/csharp-spike-publish'),evidence=resolve('.axiom/csharp-spike-evidence');
await mkdir(evidence,{recursive:true});
const begin=performance.now();
execFileSync('dotnet',['publish','spikes/csharp-wasm/Axiom.ScriptSpike.csproj','-c','Release','-o',output],{stdio:'inherit',timeout:180000});
const publishMs=performance.now()-begin;
async function files(path){const result=[];for(const item of await readdir(path,{withFileTypes:true})){const p=join(path,item.name);result.push(...item.isDirectory()?await files(p):[p]);}return result;}
const paths=await files(output),boot=paths.find(p=>p.endsWith('/_framework/dotnet.js'));assert.ok(boot,'Publish must include _framework/dotnet.js');
const framework=dirname(boot);let rawBytes=0,gzipBytes=0;
for(const p of paths.filter(p=>!p.endsWith('.gz')&&!p.endsWith('.br'))){const b=await readFile(p);rawBytes+=b.length;gzipBytes+=gzipSync(b).length;}
// Register through addEventListener: .NET 10 treats a truthy global onmessage as a pthread worker.
const worker=`addEventListener('message',async()=>{try{const start=performance.now();const {dotnet}=await import('/runtime/dotnet.js');const rt=await dotnet.withDiagnosticTracing(false).create();const api=await rt.getAssemblyExports(rt.getConfig().mainAssemblyName);const fn=api.Axiom.ScriptSpike.Program.MoveX;const startupMs=performance.now()-start;let x=0;const began=performance.now();for(let i=0;i<10000;i++)x=fn(x,1/60,6);postMessage({x,startupMs,interopCalls:10000,interopMs:performance.now()-began});}catch(e){postMessage({error:String(e),stack:e.stack});}},{once:true});`;
const server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');res.setHeader('Cross-Origin-Opener-Policy','same-origin');res.setHeader('Cross-Origin-Embedder-Policy','require-corp');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'");if(u.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><title>C# runtime spike</title>');}if(u.pathname==='/worker.js'){res.setHeader('Content-Type','text/javascript');return res.end(worker);}const name=u.pathname.replace('/runtime/','');if(!/^[a-zA-Z0-9_.-]+$/.test(name)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.wasm':'application/wasm','.json':'application/json'})[extname(name)]??'application/octet-stream');res.end(await readFile(join(framework,name)));}catch(e){res.writeHead(404);res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage();page.on('console',msg=>console.log('Browser: '+msg.text()));page.on('pageerror',e=>console.error(e));await page.goto('http://127.0.0.1:'+server.address().port);
 const runs=[];for(let i=0;i<2;i++){const r=await page.evaluate(()=>new Promise((resolve,reject)=>{const w=new Worker('/worker.js',{type:'module'});const timer=setTimeout(()=>{w.terminate();reject(new Error('Runtime startup timed out'));},60000);w.onerror=e=>{clearTimeout(timer);w.terminate();reject(new Error(e.message));};w.onmessage=e=>{clearTimeout(timer);w.terminate();resolve(e.data);};w.postMessage({});}));assert.equal(r.error,undefined,JSON.stringify(r));assert.ok(Math.abs(r.x-1000)<.001);runs.push(r);}
 const report={passed:true,publishMs,rawBytes,gzipBytes,runs,reloadWithoutPageNavigation:true};await writeFile(join(evidence,'report.json'),JSON.stringify(report,null,2));console.log('CSHARP_SPIKE='+JSON.stringify(report));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
