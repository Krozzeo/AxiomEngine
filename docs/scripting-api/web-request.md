# HTTP requests

Namespace Axiom.Gameplay.Networking. GET/HEAD/POST/PUT/DELETE and explicit methods execute through browser fetch. Example coroutine: using var r = UnityWebRequest.Get(url); yield return r.SendWebRequest(); Debug.Log(r.downloadHandler.text); CORS and mixed-content rules apply. Requests omit browser credentials and referrers; editor/daemon origin, embedded credentials and redirects are rejected. Eight simultaneous requests, upload 64 KiB, UTF-8 text download 256 KiB, timeout 1–60 seconds. Text-only download handler: data is UTF-8 encoded text, not arbitrary binary. No cookie/auth management, server-side proxy, WebSocket, multiplayer replication, file scheme or audio/texture downloads. This compatibility class retains the recognizable UnityWebRequest member name; it uses an independent Axiom implementation.


## Implemented declarations

```csharp
public sealed class UnityWebRequest : IDisposable {
 public enum Result {InProgress,Success,ConnectionError,ProtocolError,DataProcessingError}
 internal static readonly Dictionary<string,UnityWebRequest> Pending=new();private static int sequence;
 private readonly Dictionary<string,string> headers=new(StringComparer.OrdinalIgnoreCase);private bool sent;private string? requestId;private UnityWebRequestAsyncOperation? operation;
 public string url {get;set;}public string method {get;set;}public DownloadHandler downloadHandler {get;set;}=new DownloadHandlerBuffer();public UploadHandler? uploadHandler {get;set;}
 public int timeout {get;set;}=30;public bool isDone {get;private set;}public Result result {get;private set;}=Result.InProgress;public string? error {get;private set;}public long responseCode {get;private set;}
 public double downloadProgress=>isDone?1:0;public double uploadProgress=>isDone?1:0;
 public UnityWebRequest(string uri,string verb="GET"){url=uri;method=verb;}
 public static UnityWebRequest Get(string uri)=>new(uri);public static UnityWebRequest Delete(string uri)=>new(uri,"DELETE");public static UnityWebRequest Head(string uri)=>new(uri,"HEAD");
 public static UnityWebRequest Put(string uri,string body)=>new(uri,"PUT"){uploadHandler=new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(body)){contentType="text/plain;charset=utf-8"}};
 public static UnityWebRequest Post(string uri,string body,string contentType)=>new(uri,"POST"){uploadHandler=new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(body)){contentType=contentType}};
 public void SetRequestHeader(string name,string value){if(sent)throw new InvalidOperationException("Request already sent");if(headers.Count>=16||name.Length>128||value.Length>1024)throw new ArgumentException("Header limit exceeded");headers[name]=value;}
 public string? GetRequestHeader(string name)=>headers.GetValueOrDefault(name);
 public UnityWebRequestAsyncOperation SendWebRequest(){if(sent||Pending.Count>=8)throw new InvalidOperationException("Request already sent or eight requests in flight");if(!Uri.TryCreate(url,UriKind.Absolute,out var uri)||uri.Scheme!="https"&&uri.Scheme!="http"||timeout<1||timeout>60)throw new ArgumentException("Use absolute HTTP(S) URL and timeout 1–60 seconds");var hs=new JsonObject();foreach(var (key,value) in headers)hs[key]=value;if(uploadHandler!=null&&!headers.ContainsKey("Content-Type"))hs["Content-Type"]=uploadHandler.contentType;var id=(++sequence).ToString(System.Globalization.CultureInfo.InvariantCulture);var data=new JsonObject{["id"]=id,["url"]=url,["method"]=method,["headers"]=hs,["body"]=uploadHandler==null?null:Convert.ToBase64String(uploadHandler.data),["timeout"]=timeout};Context.Add(new("network","",null,default,null,Data:data.ToJsonString()));sent=true;requestId=id;Pending[id]=this;operation=new(this);return operation;}
 public void Abort(){if(isDone)return;if(requestId!=null){Context.Add(new("network","",null,default,null,Data:new JsonObject{["id"]=requestId,["abort"]=true}.ToJsonString()));Pending.Remove(requestId);}isDone=true;result=Result.ConnectionError;error="Request aborted";operation?.Complete();}
 public void Dispose(){if(sent&&!isDone)Abort();downloadHandler.Dispose();uploadHandler?.Dispose();}
 internal static void Load(JsonElement value){if(!value.TryGetProperty("networkResults",out var results))return;foreach(var item in results.EnumerateArray()){if(!Pending.Remove(item.GetProperty("id").GetString()!,out var request))continue;request.isDone=true;request.responseCode=item.GetProperty("status").GetInt64();request.downloadHandler.text=item.GetProperty("text").GetString()??"";request.error=item.GetProperty("error").GetString();request.result=request.error!=null?Result.ConnectionError:request.responseCode>=400?Result.ProtocolError:Result.Success;if(request.result==Result.ProtocolError)request.error="HTTP "+request.responseCode;request.operation?.Complete();}}
 internal static void Reset(){Pending.Clear();sequence=0;}
}

public sealed class UnityWebRequestAsyncOperation : AsyncOperation {public UnityWebRequest webRequest {get;}internal UnityWebRequestAsyncOperation(UnityWebRequest request){webRequest=request;}public override bool isDone=>webRequest.isDone;public override double progress=>isDone?1:0;}

public class DownloadHandler : IDisposable {public string text {get;internal set;}="";public byte[] data=>System.Text.Encoding.UTF8.GetBytes(text);public void Dispose(){}}

public sealed class DownloadHandlerBuffer : DownloadHandler {}

public class UploadHandler : IDisposable {public byte[] data {get;}public string contentType {get;set;}="application/octet-stream";protected UploadHandler(byte[] value){if(value.Length>65536)throw new ArgumentException("Upload exceeds 64 KiB");data=(byte[])value.Clone();}public void Dispose(){}}

public sealed class UploadHandlerRaw(byte[] value) : UploadHandler(value) {}
```
