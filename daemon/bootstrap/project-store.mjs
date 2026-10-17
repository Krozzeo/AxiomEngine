import {initializeSceneDocuments,syncSceneDocuments} from '../../engine/scene/scene-documents.mjs';
import packageData from '../../package.json' with {type:'json'};
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { mkdir, realpath, open, lstat, readdir, rename, rm, cp } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { validateProject, preserveExtensions, projectError } from "../../protocol/src/project-document.mjs";

const MAX_BYTES = 4 * 1024 * 1024;
const idPattern = /^project:\/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

export class ProjectStore {
  constructor(root,{folders=false}={}) { this.root = resolve(root); this.folders=folders;this.locations=new Map(); }

  async directory() {
    if(this.directoryFlight)return this.directoryFlight;
    const flight=this.scanDirectory();this.directoryFlight=flight;
    try{return await flight;}finally{if(this.directoryFlight===flight)this.directoryFlight=null;}
  }

  async scanDirectory() {
    await mkdir(this.root, { recursive: true });
    if ((await lstat(this.root)).isSymbolicLink()) throw projectError("AX_FS_0001", "Project root cannot be a link");
    const root=await realpath(this.root);if(this.folders){const locations=new Map();for(const entry of await readdir(root)){if(entry.startsWith('.'))continue;const folder=join(root,entry),info=await lstat(folder);if(!info.isDirectory()||info.isSymbolicLink())continue;for(const name of await readdir(folder))if(/^[0-9a-f-]{36}\.json$/.test(name)){const id='project://'+name.slice(0,-5);if(locations.has(id))throw projectError("AX_PROJECT_0002","Duplicate persistent project ID");locations.set(id,join(entry,name));}}this.locations=locations;}return root;
  }

  filename(id) {
    const match = typeof id === "string" && id.match(idPattern);
    if (!match) throw projectError("AX_FS_0001", "Expected project ID, not a filesystem path");
    return this.locations.get(id)??`${match[1]}.json`;
  }

  async read(path) {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) throw projectError("AX_FS_0001", "Project must be an ordinary unlinked file");
    const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
      const stat = await handle.stat();
      if (stat.size > MAX_BYTES || stat.ino !== info.ino || stat.nlink !== 1) throw projectError("AX_PROJECT_0002", "Invalid project file or size");
      let document;
      try { document = JSON.parse(await handle.readFile("utf8")); }
      catch { throw projectError("AX_PROJECT_0002", "Project JSON cannot be parsed"); }
      validateProject(document);
      if (basename(this.filename(document.id)) !== basename(path)) throw projectError("AX_PROJECT_0002", "Project identity does not match its file");
      return document;
    } finally { await handle.close(); }
  }


  async importLegacy(sourceRoot){
    const sourceInfo=await lstat(sourceRoot);if(!sourceInfo.isDirectory()||sourceInfo.isSymbolicLink())throw projectError('AX_FS_0001','Choose an existing ordinary projects directory');const entries=await readdir(sourceRoot);const legacy=new ProjectStore(sourceRoot,{folders:!entries.some(name=>/^[0-9a-f-]{36}\.json$/.test(name))}),items=(await legacy.run('project.list',{})).projects,imported=[];
    for(const entry of items){await this.directory();if(this.locations.has(entry.id))continue;const document=(await legacy.run('project.open',{id:entry.id})).project;
      const folder=join(this.root,(document.name.startsWith('.')?'_'+document.name:document.name).replace(/[\/<>:\"|?*\\\u0000-\u001f]/g,'_').replace(/[. ]+$/,'')+' ('+entry.id.slice(10,18)+')');
      await mkdir(folder);try{const destination=join(folder,entry.id.slice(10)+'.json');await cp(join(sourceRoot,legacy.filename(entry.id)),destination,{errorOnExist:true,force:false});
        for(const extension of ['.assets','.scripts']){const source=join(sourceRoot,legacy.filename(entry.id).replace(/\.json$/,extension));try{await verifyTree(source);await cp(source,join(folder,basename(legacy.filename(entry.id)).replace(/\.json$/,extension)),{recursive:true,errorOnExist:true,force:false});}catch(e){if(e.code!=='ENOENT')throw e;}}
        this.locations.set(entry.id,join(folder.split(/[\\/]/).at(-1),entry.id.slice(10)+'.json'));await this.read(destination);imported.push(entry.id);
      }catch(error){await rm(folder,{recursive:true,force:true});throw error;}
    }return {imported};
  }

  async run(type, data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw projectError("AX_PROJECT_0002", "Expected command data");
    const directory = await this.directory();
    if (type === "project.list") {
      const projects = [];
      const files = this.folders?[...this.locations.values()].sort():(await readdir(directory)).filter(name => /^[0-9a-f-]{36}\.json$/.test(name)).sort();
      if (files.length > 256) throw projectError("AX_PROJECT_0002", "Project listing exceeds 256 entries");
      for (const file of files) {
        const document = await this.read(join(directory, file));
        projects.push({ id: document.id, name: document.name, revision: document.revision,createdWithVersion:document.axiom?.createdWithVersion??null,lastSavedWithVersion:document.axiom?.lastSavedWithVersion??null,applicationId:document.axiom?.applicationId??'game-engine',path:join(directory,file),createdAt:document.axiom?.createdAt??null,modifiedAt:document.axiom?.modifiedAt??null,formatVersion:document.schemaVersion });
      }
      return { projects };
    }
    let document;
    const id = type === "project.create" ? `project://${randomUUID()}` : data.id;
    if(type==='project.create'&&this.folders){let folder=String(data.name??'').replace(/[\/<>:"|?*\\\u0000-\u001f]/g,'_').replace(/[. ]+$/,'').trim();if(folder.startsWith('.'))folder='_'+folder;if(!folder||folder==='.'||folder==='..')throw projectError('AX_PROJECT_0002','Invalid project name');if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(folder))folder='_'+folder;try{await mkdir(join(directory,folder));}catch(e){if(e.code!=='EEXIST')throw e;folder+=' ('+id.slice(10,18)+')';await mkdir(join(directory,folder));}this.locations.set(id,join(folder,id.slice(10)+'.json'));}
    const path = join(directory, this.filename(id));
    if (type === "project.open") return { project: await this.read(path) };
    if(type==='project.delete'){if(data.confirm!==true)throw projectError('AX_PROJECT_0002','Project deletion requires confirmation');await this.read(path);if(this.folders&&!this.locations.has(id))throw projectError('AX_FS_0001','Unknown project folder');await rm(this.folders?join(directory,this.filename(id).split(/[\\/]/)[0]):path,{recursive:this.folders,force:false});if(!this.folders)for(const extension of ['.assets','.scripts'])await rm(path.replace(/\.json$/,extension),{recursive:true,force:true});this.locations.delete(id);return {deleted:id};}
    if (!["project.create", "project.save"].includes(type)) throw projectError("AX_COMMAND_0002", "Unknown project command");
    let lock;
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      lock = await open(`${path}.lock`, "wx", 0o600);
      if (type === "project.create") {
        document = { schemaVersion: 1, id, name: data.name, revision: 0, axiom:{createdAt:new Date().toISOString(),modifiedAt:new Date().toISOString(),applicationId:'game-engine',createdWithVersion:packageData.version,lastSavedWithVersion:packageData.version,projectFormatVersion:1}, scene: { schemaVersion: 1, id: `scene://${randomUUID()}`, entities: [] } };
      } else {
        const previous = await this.read(path);
        if (!Number.isSafeInteger(data.expectedRevision) || data.expectedRevision !== previous.revision) throw projectError("AX_PROJECT_0003", "Project revision conflict; reopen before saving");
        if (data.scene?.id !== previous.scene.id) throw projectError("AX_PROJECT_0002", "Scene identity cannot change during save");
        if(data.scene?.sceneDocuments)syncSceneDocuments(data.scene);
        // Validate supplied known fields before preserving extensions.
        validateProject({ ...previous, scene: data.scene, ...(data.editor?{editor:data.editor}:{}) });
        document = { ...previous, axiom:{...previous.axiom,modifiedAt:new Date().toISOString(),applicationId:previous.axiom?.applicationId??'game-engine',createdWithVersion:previous.axiom?.createdWithVersion??null,lastSavedWithVersion:packageData.version,projectFormatVersion:1}, scene: preserveExtensions(previous.scene, data.scene), revision: previous.revision + 1, ...(data.editor?{editor:data.editor}:{}) };
      }
      if(type==='project.create')initializeSceneDocuments(document.scene);
      validateProject(document);
      const bytes = JSON.stringify(document, null, 2) + "\n";
      if (Buffer.byteLength(bytes) > MAX_BYTES) throw projectError("AX_PROJECT_0002", "Project size exceeds limit");
      const handle = await open(temporary, "wx", 0o600);
      try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
      await rename(temporary, path);
      return { project: JSON.parse(bytes) };
    } catch (error) {
      if (error.code === "EEXIST") throw projectError("AX_PROJECT_0004", "Project is locked by another operation");
      throw error;
    } finally {
      await rm(temporary, { force: true });
      if (lock) { await lock.close(); await rm(`${path}.lock`, { force: true }); }
    }
  }
}

async function verifyTree(path){const info=await lstat(path);if(info.isSymbolicLink()||info.isFile()&&info.nlink!==1)throw projectError('AX_FS_0001','Legacy resources cannot contain links');if(info.isDirectory())for(const name of await readdir(path))await verifyTree(join(path,name));}
