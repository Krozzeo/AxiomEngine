// addEventListener preserves .NET 10's sidecar-worker detection (runtime#114918).
let dispatch=null;
let ready=false;
addEventListener('message',async ({data})=>{
 try {
  if(data.type==='initialize') {
   if(ready)throw new Error('Runtime already initialized');ready=true;
   const url=new URL(data.url,location.origin);
   if(url.origin!==location.origin||!url.pathname.endsWith('/dotnet.js'))throw new Error('Invalid runtime module URL');
   const {dotnet}=await import(url.href);
   const runtime=await dotnet.withDiagnosticTracing(false).create();
   const exports=await runtime.getAssemblyExports(runtime.getConfig().mainAssemblyName);
   dispatch=exports.Axiom.ScriptHost.Program.Dispatch;
   postMessage({id:data.id,ready:true});
  }else {
   if(!dispatch)throw new Error('Runtime is not ready');
   const started=performance.now();
   const output=dispatch(JSON.stringify(data.request));
   if(output.length>256*1024)throw new Error('Script response exceeds limit');
   const workerDispatchMs=performance.now()-started;
   postMessage({id:data.id,result:{...JSON.parse(output),metrics:{workerDispatchMs}}});
  }
 }catch(error){postMessage({id:data.id,error:String(error).slice(0,4096)});}
});
