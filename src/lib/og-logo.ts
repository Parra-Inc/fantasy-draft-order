import { cfEnv } from "@/lib/cloudflare/context";

/**
 * Load a logo from public/ as a data URI, for embedding in an OG image.
 *
 * Satori needs the bytes inline, and inside the worker public/ is not on any
 * filesystem — it is served by the ASSETS binding. So fetch it from there,
 * falling back to disk when running off Workers (build-time prerender, dev).
 *
 * A module-scope readFileSync(process.cwd() + "/public/...") is the obvious
 * way to write this and does not work: it throws when the module loads in the
 * worker, taking the whole image route down with it.
 */
const cache = new Map<string, Promise<string>>();

export function loadLogoDataUri(fileName: string): Promise<string> {
  let pending = cache.get(fileName);
  if (!pending) {
    pending = read(fileName);
    cache.set(fileName, pending);
  }
  return pending;
}

async function read(fileName: string): Promise<string> {
  const assets = cfEnv()?.ASSETS;
  if (assets) {
    const res = await assets.fetch(`https://assets.local/${fileName}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    return `data:image/png;base64,${bytes.toString("base64")}`;
  }
  const { readFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const bytes = readFileSync(join(process.cwd(), "public", fileName));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}
