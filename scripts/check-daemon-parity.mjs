import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const [bootstrapServer, bootstrapBus, native, vectors] = await Promise.all([
  readFile(resolve(root, "daemon/bootstrap/server.mjs"), "utf8"),
  readFile(resolve(root, "daemon/bootstrap/command-bus.mjs"), "utf8"),
  readFile(resolve(root, "daemon/axiom-daemon/src/lib.rs"), "utf8"),
  readFile(resolve(root, "protocol/fixtures/command-parity.json"), "utf8").then(JSON.parse)
]);
const bootstrap = `${bootstrapServer}\n${bootstrapBus}`;

const requiredEndpoints = [
  "/health",
  "/v1/handshake",
  "/v1/commands",
  "/v1/events",
  "/v1/traces/",
  "/v1/metrics"
];
const requiredCodes = [
  "AX_SECURITY_0001",
  "AX_SECURITY_0002",
  "AX_PROTOCOL_0003",
  "AX_COMMAND_0002",
  "AX_COMMAND_0003",
  "AX_COMMAND_0004",
  "AX_COMMAND_0005",
  "AX_DIAGNOSTICS_0001"
];
const failures = [];

for (const endpoint of requiredEndpoints) {
  const nativeEndpoint = endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint;
  if (!bootstrap.includes(endpoint)) failures.push(`bootstrap is missing ${endpoint}`);
  if (!native.includes(nativeEndpoint)) failures.push(`native daemon is missing ${endpoint}`);
}
for (const code of requiredCodes) {
  if (!bootstrap.includes(code)) failures.push(`bootstrap is missing ${code}`);
  if (!native.includes(code)) failures.push(`native daemon is missing ${code}`);
}
for (const header of ["Cross-Origin-Opener-Policy", "Cross-Origin-Embedder-Policy", "Content-Security-Policy"]) {
  if (!bootstrap.toLowerCase().includes(header.toLowerCase())) failures.push(`bootstrap is missing ${header}`);
  if (!native.toLowerCase().includes(header.toLowerCase())) failures.push(`native daemon is missing ${header}`);
}
// CSP's narrow Wasm compilation permission is not Rust unsafe code (ADR-0016).
const nativePolicySource = native.replaceAll("'wasm-unsafe-eval'", "");
if (/Command::new|0\.0\.0\.0|\bunsafe\b/.test(nativePolicySource)) {
  failures.push("native daemon violates the M0 deny-by-default source policy");
}
if (!Array.isArray(vectors) || vectors.length < 6) {
  failures.push("shared command parity corpus is missing or incomplete");
}
if (failures.length) throw new Error(failures.join("\n"));
console.log(`Daemon adapter parity surface passed (${requiredEndpoints.length} endpoints, ${requiredCodes.length} codes, ${vectors.length} vectors)`);
