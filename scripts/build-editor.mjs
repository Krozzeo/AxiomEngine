import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(import.meta.dirname, "..");
const destination = resolve(root, "dist/editor");

export async function buildEditor() {
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  await cp(resolve(root, "apps/editor/index.html"), resolve(destination, "index.html"));
  await cp(resolve(root, "apps/editor/styles.css"), resolve(destination, "styles.css"));
  const source = await readFile(resolve(root, "apps/editor/src/main.ts"), "utf8");
  if (/\binterface\s+|:\s*(string|number|boolean)\b/.test(source)) {
    throw new Error("Bootstrap TypeScript must remain directly executable until the compiler toolchain is installed");
  }
  await writeFile(resolve(destination, "main.js"), source);
  console.log("Built editor bootstrap → dist/editor");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await buildEditor();
