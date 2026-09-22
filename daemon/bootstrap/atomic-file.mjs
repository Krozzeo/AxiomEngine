import { mkdir, open, rename, rm } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

export function resolveInside(root, relativePath) {
  const absoluteRoot = resolve(root);
  const target = resolve(absoluteRoot, relativePath);
  if (target !== absoluteRoot && !target.startsWith(`${absoluteRoot}${sep}`)) {
    throw Object.assign(new Error("Path escapes the authorized workspace"), {
      code: "AX_FS_0001"
    });
  }
  return target;
}

export async function atomicWrite(root, relativePath, content) {
  const target = resolveInside(root, relativePath);
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.axiom-tmp-${process.pid}-${Date.now()}`;
  let handle;
  try {
    handle = await open(temporary, "wx", 0o600);
    await handle.writeFile(content);
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporary, target);
  } finally {
    await handle?.close().catch(() => {});
    await rm(temporary, { force: true }).catch(() => {});
  }
  return target;
}

