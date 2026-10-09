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

export async function buildEditor({buildKernel=true}={}) {
  if(buildKernel)runCargo(["build", "--locked", "--release", "-p", "axiom-wasm", "--target", "wasm32-unknown-unknown"]);
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  await cp(resolve(root, "target/wasm32-unknown-unknown/release/axiom_wasm.wasm"), resolve(destination, "axiom-kernel.wasm"));
  await writeFile(resolve(destination,'kernel-host.js'),(await readFile(resolve(root,'engine/wasm/host.mjs'),'utf8')).replace('../scene/hierarchy.mjs','./hierarchy.mjs').replace('../scene/camera.mjs','./camera.mjs'));
  await writeFile(resolve(destination,"index.html"),(await readFile(resolve(root,"apps/editor/index.html"),"utf8")).replaceAll("__AXIOM_VERSION__",JSON.parse(await readFile(resolve(root,"package.json"),"utf8")).version));
  await writeFile(resolve(destination,'replay-session.mjs'),(await readFile(resolve(root,'engine/replay/session.mjs'),'utf8')).replace('../testing/session.mjs','./test-session.mjs').replace('../../protocol/schema/replay-recording.schema.json','./replay-recording.schema.json'));
  await cp(resolve(root,'protocol/schema/replay-recording.schema.json'),resolve(destination,'replay-recording.schema.json'));
  await cp(resolve(root,"apps/editor/icons"),resolve(destination,"icons"),{recursive:true});
  await cp(resolve(root, "apps/editor/styles.css"), resolve(destination, "styles.css"));
  await cp(resolve(root, "apps/editor/src/frame-profiler.mjs"), resolve(destination, "frame-profiler.js"));
  await writeFile(resolve(destination,"project-editor.js"),(await readFile(resolve(root,"apps/editor/src/project-editor.mjs"),"utf8")).replaceAll("../../../engine/renderer/","./").replaceAll("../../../engine/scene/","./").replaceAll("../../../engine/scripting/","./"));
  await cp(resolve(root, "apps/editor/src/proposal-editor.mjs"), resolve(destination, "proposal-editor.js"));
  await cp(resolve(root, "apps/editor/src/agent-bridge.mjs"), resolve(destination, "agent-bridge.js"));
  await writeFile(resolve(destination,"scene-renderer.js"),(await readFile(resolve(root,"apps/editor/src/scene-renderer.mjs"),"utf8")).replaceAll("../../../engine/renderer/","./").replaceAll("../../../engine/scene/","./").replaceAll("../../../engine/scripting/","./"));
  await cp(resolve(root,'engine/scene/hierarchy.mjs'),resolve(destination,'hierarchy.mjs'));
  await writeFile(resolve(destination,'hierarchy.mjs'),(await readFile(resolve(destination,'hierarchy.mjs'),'utf8')).replace('../renderer/','./'));
  await cp(resolve(root,'engine/scene/project-files.mjs'),resolve(destination,'project-files.mjs'));
  await cp(resolve(root,'protocol/schema/project-document.schema.json'),resolve(destination,'project-document.schema.json'));
  await writeFile(resolve(destination,'runtime-edit.mjs'),(await readFile(resolve(root,'engine/scene/runtime-edit.mjs'),'utf8')).replace('../../protocol/schema/project-document.schema.json','./project-document.schema.json').replace('../scripting/fields.mjs','./fields.mjs'));
  await writeFile(resolve(destination,'fields.mjs'),(await readFile(resolve(root,'engine/scripting/fields.mjs'),'utf8')).replaceAll('../scene/','./'));
  await writeFile(resolve(destination,'editor-operations.mjs'),(await readFile(resolve(root,'engine/scene/editor-operations.mjs'),'utf8')).replaceAll('../renderer/','./'));
  await writeFile(resolve(destination,'two-d-editor.mjs'),(await readFile(resolve(root,'apps/editor/src/two-d-editor.mjs'),'utf8')).replaceAll('../../../engine/renderer/','./').replaceAll('../../../engine/scene/','./').replaceAll('../../../engine/scripting/','./'));
  await cp(resolve(root,'apps/editor/src/animation-editor.mjs'),resolve(destination,'animation-editor.mjs'));
  await cp(resolve(root,'apps/editor/src/panel-layout.mjs'),resolve(destination,'panel-layout.mjs'));
  for(const name of ['render-plan','render-math','production-gpu','production-shaders','two-d-plan','two-d-gpu','skin-gpu'])await cp(resolve(root,'engine/renderer',name+'.mjs'),resolve(destination,name+'.mjs'));
  for(const name of ['ai-assistant','autonomy-editor','compile-controller','inspector-ux','script-editor','code-editor','project-browser','editor-actions','editor-menu','replay-editor','ai-menu','game-test-editor','parallel-view','view-math','scene-tools','causal-diagnostics','gpu-profiler','profiler-editor','dock-layout','session-token','frame-profiler'])await writeFile(resolve(destination,name+'.mjs'),(await readFile(resolve(root,'apps/editor/src',name+'.mjs'),'utf8')).replaceAll('../../../engine/renderer/','./').replaceAll('../../../engine/scene/','./').replaceAll('../../../engine/scripting/','./'));
  for(const [name,target]of [["runtime.mjs","script-runtime.js"],["worker.mjs","script-worker.js"],["operations.mjs","script-operations.mjs"],["contract.mjs","contract.mjs"]])await cp(resolve(root,"engine/scripting",name),resolve(destination,target));
  await cp(resolve(root,"engine/scripting/templates/Game.cs"),resolve(destination,"default-game.cs"));
  await writeFile(resolve(destination,'animation-host.mjs'),(await readFile(resolve(root,'engine/wasm/animation-host.mjs'),'utf8')).replace('../renderer/','./'));
  await cp(resolve(root,"engine/wasm/physics-host.mjs"),resolve(destination,"physics-host.mjs"));
  for(const name of ['audio-session','audio-worklet','audio-editor'])await writeFile(resolve(destination,name+'.mjs'),(await readFile(resolve(root,'apps/editor/src',name+'.mjs'),'utf8')).replaceAll('../../../engine/audio/','./'));
  for(const name of ['plan','pcm-stream'])await writeFile(resolve(destination,name+'.mjs'),(await readFile(resolve(root,'engine/audio',name+'.mjs'),'utf8')).replaceAll('../scene/','./'));
  await writeFile(resolve(destination,'camera.mjs'),(await readFile(resolve(root,'engine/scene/camera.mjs'),'utf8')).replaceAll('../renderer/','./'));
  await writeFile(resolve(destination,'test-session.mjs'),(await readFile(resolve(root,'engine/testing/session.mjs'),'utf8')).replace('../../protocol/schema/game-test.schema.json','./game-test.schema.json'));
  await cp(resolve(root,'protocol/schema/game-test.schema.json'),resolve(destination,'game-test.schema.json'));
  const source = await readFile(resolve(root, "apps/editor/src/main.ts"), "utf8");
  if (/\binterface\s+|:\s*(string|number|boolean)\b/.test(source)) {
    throw new Error("Bootstrap TypeScript must remain directly executable until the compiler toolchain is installed");
  }
  await writeFile(resolve(destination, "main.js"), source);
  console.log("Built editor bootstrap → dist/editor");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await buildEditor();
