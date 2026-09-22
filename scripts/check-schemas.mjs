import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const schemaDirectory = resolve(root, "protocol/schema");
const files = (await readdir(schemaDirectory)).filter((name) => name.endsWith(".json"));
const identifiers = new Set();
for (const name of files) {
  const value = JSON.parse(await readFile(resolve(schemaDirectory, name), "utf8"));
  if (!value.$schema) throw new Error(`${name}: missing $schema`);
  if (name.endsWith(".schema.json")) {
    if (!value.$id) throw new Error(`${name}: missing stable $id`);
    if (identifiers.has(value.$id)) throw new Error(`${name}: duplicate $id ${value.$id}`);
    identifiers.add(value.$id);
  }
}
const architecture = JSON.parse(await readFile(resolve(root, "axiom.architecture.json"), "utf8"));
if (architecture.manifestVersion !== 1) throw new Error("Unsupported architecture manifest version");
if (!architecture.constraints?.length) throw new Error("Architecture manifest has no enforceable constraints");
console.log(`Validated ${files.length} schema documents and the architecture manifest`);

