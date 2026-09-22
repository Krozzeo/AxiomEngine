import { spawnSync } from "node:child_process";

const windows = process.platform === "win32";
const checks = [
  ["node", process.execPath, ["--version"], true],
  ["npm", windows ? "npm.cmd" : "npm", ["--version"], true],
  ["git", windows ? "git.exe" : "git", ["--version"], false],
  ["cargo", windows ? "cargo.exe" : "cargo", ["--version"], true],
  ["rustc", windows ? "rustc.exe" : "rustc", ["--version"], true],
  ["dotnet", windows ? "dotnet.exe" : "dotnet", ["--version"], false]
];

let requiredMissing = false;
for (const [label, program, args, required] of checks) {
  const result = spawnSync(program, args, {
    encoding: "utf8",
    shell: windows && program.endsWith(".cmd")
  });
  const available = result.status === 0;
  const suffix = available ? ` ${result.stdout.trim()}` : required ? " required" : " optional for current bootstrap";
  console.log(`${available ? "✓" : required ? "✗" : "○"} ${label}${suffix}`);
  if (required && !available) requiredMissing = true;
}
process.exitCode = requiredMissing ? 1 : 0;
