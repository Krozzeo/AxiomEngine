import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const rules = [
  { roots: ["engine"], forbidden: ["apps/editor", "document.", "window.", "navigator."], id: "engine-no-editor-or-dom" },
  { roots: ["engine/renderer"], forbidden: ["gameplay", "PlayerController"], id: "renderer-no-gameplay" },
  { roots: ["daemon"], forbidden: ["engine/gameplay", "PlayerController"], id: "daemon-no-gameplay" }
];

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["dist", "target", "node_modules", ".git"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(path));
    else if ([".rs", ".ts", ".mjs", ".js"].includes(extname(entry.name))) output.push(path);
  }
  return output;
}

const failures = [];
for (const rule of rules) {
  for (const directory of rule.roots) {
    const files = await walk(resolve(root, directory));
    for (const file of files) {
      const source = await readFile(file, "utf8");
      for (const forbidden of rule.forbidden) {
        // A canonical schema filename is data, not a DOM dependency.
        if (source.replaceAll("project-document.schema.json", "project-schema-json").includes(forbidden)) failures.push(`${rule.id}: ${relative(root, file)} contains ${forbidden}`);
      }
    }
  }
}
if (failures.length) throw new Error(failures.join("\n"));
console.log(`Architecture dependency rules passed (${rules.length} rules)`);

