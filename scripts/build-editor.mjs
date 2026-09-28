import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve, win32, posix } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const destination = resolve(root, "dist/editor");

export function runCargo(args, {
  platform = process.platform, env = process.env, home = homedir(), execute = execFileSync
} = {}) {
  const path = platform === "win32" ? win32 : posix;
  const executable = platform === "win32" ? "cargo.exe" : "cargo";
  const candidates = [executable];
  if (env.CARGO_HOME) candidates.push(path.join(env.CARGO_HOME, "bin", executable));
  candidates.push(path.join(platform === "win32" ? env.USERPROFILE || home : home, ".cargo", "bin", executable));
  for (const candidate of new Set(candidates)) {
    try {
      return execute(candidate, args, { cwd: root, env, stdio: "inherit" });
    } catch (error) {
      // A compiler failure must remain visible; only missing executables allow fallback.
      if (error.code !== "ENOENT") throw error;
    }
  }
  throw new Error(`AX_BUILD_0001: Cargo was not found. Tried: ${candidates.join(", ")}. Install Rust 1.90 through rustup or set CARGO_HOME to its installation directory, then reopen the terminal.`);
}

export async function buildEditor() {
  runCargo(["build", "--locked", "--release", "-p", "axiom-wasm", "--target", "wasm32-unknown-unknown"]);
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  await cp(resolve(root, "target/wasm32-unknown-unknown/release/axiom_wasm.wasm"), resolve(destination, "axiom-kernel.wasm"));
  await cp(resolve(root, "engine/wasm/host.mjs"), resolve(destination, "kernel-host.js"));
  await cp(resolve(root, "apps/editor/index.html"), resolve(destination, "index.html"));
  await cp(resolve(root, "apps/editor/styles.css"), resolve(destination, "styles.css"));
  await cp(resolve(root, "apps/editor/src/frame-profiler.mjs"), resolve(destination, "frame-profiler.js"));
  await cp(resolve(root, "apps/editor/src/project-editor.mjs"), resolve(destination, "project-editor.js"));
  await cp(resolve(root, "apps/editor/src/agent-bridge.mjs"), resolve(destination, "agent-bridge.js"));
  await cp(resolve(root, "apps/editor/src/scene-renderer.mjs"), resolve(destination, "scene-renderer.js"));
  for(const [name,target]of [["runtime.mjs","script-runtime.js"],["worker.mjs","script-worker.js"],["operations.mjs","script-operations.mjs"],["contract.mjs","contract.mjs"]])await cp(resolve(root,"engine/scripting",name),resolve(destination,target));
  await cp(resolve(root,"engine/scripting/templates/Game.cs"),resolve(destination,"default-game.cs"));
  const source = await readFile(resolve(root, "apps/editor/src/main.ts"), "utf8");
  if (/\binterface\s+|:\s*(string|number|boolean)\b/.test(source)) {
    throw new Error("Bootstrap TypeScript must remain directly executable until the compiler toolchain is installed");
  }
  await writeFile(resolve(destination, "main.js"), source);
  console.log("Built editor bootstrap → dist/editor");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await buildEditor();
