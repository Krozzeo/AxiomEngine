import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { mkdir, realpath, open, lstat, readdir, rename, rm } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { validateProject, preserveExtensions, projectError } from "../../protocol/src/project-document.mjs";

const MAX_BYTES = 192 * 1024;
const idPattern = /^project:\/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

export class ProjectStore {
  constructor(root) { this.root = resolve(root); }

  async directory() {
    await mkdir(this.root, { recursive: true });
    if ((await lstat(this.root)).isSymbolicLink()) throw projectError("AX_FS_0001", "Project root cannot be a link");
    return realpath(this.root);
  }

  filename(id) {
    const match = typeof id === "string" && id.match(idPattern);
    if (!match) throw projectError("AX_FS_0001", "Expected project ID, not a filesystem path");
    return `${match[1]}.json`;
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
      if (this.filename(document.id) !== basename(path)) throw projectError("AX_PROJECT_0002", "Project identity does not match its file");
      return document;
    } finally { await handle.close(); }
  }

  async run(type, data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw projectError("AX_PROJECT_0002", "Expected command data");
    const directory = await this.directory();
    if (type === "project.list") {
      const projects = [];
      const files = (await readdir(directory)).filter(name => /^[0-9a-f-]{36}\.json$/.test(name)).sort();
      if (files.length > 256) throw projectError("AX_PROJECT_0002", "Project listing exceeds 256 entries");
      for (const file of files) {
        const document = await this.read(join(directory, file));
        projects.push({ id: document.id, name: document.name, revision: document.revision });
      }
      return { projects };
    }
    let document;
    const id = type === "project.create" ? `project://${randomUUID()}` : data.id;
    const path = join(directory, this.filename(id));
    if (type === "project.open") return { project: await this.read(path) };
    if (!["project.create", "project.save"].includes(type)) throw projectError("AX_COMMAND_0002", "Unknown project command");
    let lock;
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      lock = await open(`${path}.lock`, "wx", 0o600);
      if (type === "project.create") {
        document = { schemaVersion: 1, id, name: data.name, revision: 0, scene: { schemaVersion: 1, id: `scene://${randomUUID()}`, entities: [] } };
      } else {
        const previous = await this.read(path);
        if (!Number.isSafeInteger(data.expectedRevision) || data.expectedRevision !== previous.revision) throw projectError("AX_PROJECT_0003", "Project revision conflict; reopen before saving");
        if (data.scene?.id !== previous.scene.id) throw projectError("AX_PROJECT_0002", "Scene identity cannot change during save");
        // Validate supplied known fields before preserving extensions.
        validateProject({ ...previous, scene: data.scene, ...(data.editor?{editor:data.editor}:{}) });
        document = { ...previous, scene: preserveExtensions(previous.scene, data.scene), revision: previous.revision + 1, ...(data.editor?{editor:data.editor}:{}) };
      }
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
