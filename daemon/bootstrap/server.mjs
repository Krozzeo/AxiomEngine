import { createHash, randomBytes } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CommandBus } from "./command-bus.mjs";
import { ProjectStore } from "./project-store.mjs";
import { buildEditor } from "../../scripts/build-editor.mjs";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const DIST = join(ROOT, "dist/editor");
const BODY_LIMIT = 256 * 1024;
const SECURITY_HEADERS = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
};

async function ensureEditorBuild() {
  try {
    await Promise.all([
      access(join(DIST, "index.html")),
      access(join(DIST, "styles.css")),
      access(join(DIST, "main.js"))
    ]);
  } catch {
    await buildEditor();
  }
}

function json(response, status, value) {
  response.writeHead(status, { ...SECURITY_HEADERS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
}

async function readJson(request) {
  let total = 0;
  const chunks = [];
  for await (const chunk of request) {
    total += chunk.length;
    if (total > BODY_LIMIT) throw Object.assign(new Error("Request body too large"), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Malformed JSON"), { status: 400 });
  }
}

async function schemaHash() {
  const files = ["command.schema.json", "event.schema.json", "protocol-envelope.schema.json", "project-document.schema.json"];
  const hash = createHash("sha256");
  for (const file of files) hash.update(await readFile(join(ROOT, "protocol/schema", file)));
  return `sha256:${hash.digest("hex")}`;
}

function mime(path) {
  return ({ ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" })[extname(path)] ?? "application/octet-stream";
}

export async function startServer(options = {}) {
  await ensureEditorBuild();
  const token = options.token ?? randomBytes(32).toString("base64url");
  const bus = new CommandBus({ projects: new ProjectStore(options.projectRoot ?? join(ROOT, ".axiom/projects")) });
  const hash = await schemaHash();
  const startedAt = performance.now();
  let requestCount = 0;
  let rejectedCount = 0;
  let allowedOrigins = new Set();

  const server = createHttpServer(async (request, response) => {
    requestCount += 1;
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    try {
      if (url.pathname.startsWith("/v1/")) {
        const origin = request.headers.origin;
        const authorization = request.headers.authorization;
        const fetchSite = request.headers["sec-fetch-site"];
        // Browsers commonly omit Origin on same-origin GET requests. Sec-Fetch-Site
        // is a forbidden request header controlled by the browser, so it safely
        // distinguishes that case. Requests carrying Origin must always match it.
        const authorizedBrowserContext = origin
          ? allowedOrigins.has(origin)
          : fetchSite === "same-origin";
        if (!authorizedBrowserContext) {
          rejectedCount += 1;
          return json(response, 403, { code: "AX_SECURITY_0001", cause: "Origin is not authorized" });
        }
        if (authorization !== `Bearer ${token}`) {
          rejectedCount += 1;
          return json(response, 401, { code: "AX_SECURITY_0002", cause: "Session token is invalid" });
        }
      }

      if (request.method === "GET" && url.pathname === "/health") {
        return json(response, 200, { status: "ok", service: "axiom-daemon-bootstrap", version: "0.0.10" });
      }

      if (request.method === "GET" && url.pathname === "/v1/handshake") {
        const requested = Number(request.headers["axiom-protocol-version"] ?? 1);
        if (requested !== 1) return json(response, 409, { code: "AX_PROTOCOL_0003", supported: { min: 1, max: 1 } });
        return json(response, 200, {
          protocol: { min: 1, max: 1, selected: 1 },
          schemaHash: hash,
          server: { name: "axiom-daemon-bootstrap", version: "0.0.10" },
          capabilities: ["command.system.ping", "command.demo.increment", "command.editor.undo", "events.delta", "diagnostics.trace", "command.project.create", "command.project.open", "command.project.save", "command.project.list"],
          limits: { requestBytes: BODY_LIMIT, retainedEvents: 512, retainedTraces: 128 }
        });
      }

      if (request.method === "POST" && url.pathname === "/v1/commands") {
        const command = await readJson(request);
        const result = await bus.dispatch(command);
        return json(response, result.kind === "error" ? 422 : 200, result);
      }

      if (request.method === "GET" && url.pathname === "/v1/events") {
        return json(response, 200, { events: bus.eventsSince(Number(url.searchParams.get("since") ?? 0)), state: bus.state });
      }

      if (request.method === "GET" && url.pathname.startsWith("/v1/traces/")) {
        const trace = bus.trace(decodeURIComponent(url.pathname.slice("/v1/traces/".length)));
        return trace ? json(response, 200, trace) : json(response, 404, { code: "AX_DIAGNOSTICS_0001", cause: "Trace was not retained" });
      }

      if (request.method === "GET" && url.pathname === "/v1/metrics") {
        return json(response, 200, {
          uptimeMs: performance.now() - startedAt,
          requests: requestCount,
          securityRejections: rejectedCount,
          commandState: bus.state
        });
      }

      if (request.method === "GET") {
        const relative = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
        if (relative.includes("..") || relative.includes("\\")) return json(response, 400, { code: "AX_HTTP_0001" });
        const path = join(DIST, relative);
        const content = await readFile(path);
        response.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": mime(path), "Cache-Control": relative === "index.html" ? "no-store" : "public, max-age=60" });
        return response.end(content);
      }

      return json(response, 404, { code: "AX_HTTP_0002", cause: "Route not found" });
    } catch (error) {
      return json(response, error.status ?? 500, { code: error.status === 413 ? "AX_HTTP_0003" : "AX_SYSTEM_0002", cause: error.message });
    }
  });

  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  allowedOrigins = new Set([origin, `http://localhost:${address.port}`]);
  return {
    server,
    token,
    origin,
    editorUrl: `${origin}/#token=${encodeURIComponent(token)}`,
    close: () => new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()))
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.AXIOM_PORT ? Number(process.env.AXIOM_PORT) : 4317;
  const instance = await startServer({ port });
  console.log(`Axiom daemon bootstrap listening at ${instance.origin}`);
  console.log(`Open editor: ${instance.editorUrl}`);
}
