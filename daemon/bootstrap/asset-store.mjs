import { createHash, randomUUID } from "node:crypto";
import { mkdir, lstat, open, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { decodeAsset, ASSET_BYTES } from "../../engine/assets/import.mjs";
import { projectError } from "../../protocol/src/project-document.mjs";
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
export class AssetStore {
  constructor(projects) { this.projects=projects; }
  async path(projectId, assetId) {
    if(!/^asset:\/\/[0-9a-f]{64}$/.test(assetId)) throw projectError("AX_ASSET_0001","Invalid asset ID");
    const root=await this.projects.directory();
    const folder=join(root,this.projects.filename(projectId).replace(/\.json$/,".assets"));
    await mkdir(folder,{recursive:true});
    if((await lstat(folder)).isSymbolicLink()) throw projectError("AX_FS_0001","Asset folder cannot be a link");
    return join(folder,assetId.slice(8)+".bin");
  }
  async read(projectId,assetId) {return decodeAsset(await this.readBytes(projectId,assetId));}
  async readBytes(projectId, assetId) {
    const path=await this.path(projectId,assetId), info=await lstat(path);
    if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||info.size>ASSET_BYTES) throw projectError("AX_ASSET_0001","Invalid asset file");
    const handle=await open(path,"r");
    let bytes;
    try {
      const stat=await handle.stat();
      if(stat.ino!==info.ino||stat.nlink!==1||stat.size>ASSET_BYTES) throw projectError("AX_ASSET_0001","Asset changed during read");
      bytes=await handle.readFile();
    } finally {await handle.close();}
    if(`asset://${digest(bytes)}`!==assetId) throw projectError("AX_ASSET_0001","Asset hash mismatch; restore the original file");
    return bytes;
  }
  async put(projectId,name,encoded,decode=async bytes=>decodeAsset(bytes)) {
    if(typeof name!=="string"||name.length<1||name.length>128||typeof encoded!=="string"||encoded.length>Math.ceil(ASSET_BYTES/3)*4||(encoded.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))) throw projectError("AX_ASSET_0001","Invalid asset name or base64 data");
    const bytes=Buffer.from(encoded,"base64");
    if(bytes.toString("base64")!==encoded)throw projectError("AX_ASSET_0001","Invalid base64 padding");
    const asset=await decode(bytes), id=`asset://${digest(bytes)}`;
    const path=await this.path(projectId,id), temporary=path+"."+randomUUID()+".tmp";
    try {
      try { await this.readBytes(projectId,id); return {id,name,kind:asset.kind}; } catch(error) {if(error.code!=="ENOENT") throw error;}
      const file=await open(temporary,"wx",0o600);
      try{await file.writeFile(bytes);await file.sync();}finally{await file.close();}
      // Same content hash means concurrent imports can only publish identical bytes.
      await rename(temporary,path);
      return {id,name,kind:asset.kind};
    } finally {await rm(temporary,{force:true});}
  }
}
