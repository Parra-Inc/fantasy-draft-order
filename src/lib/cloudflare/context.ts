import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Cloudflare bindings for the current request, or undefined when not running
 * on Workers (`next build`, node scripts, vitest). Callers treat a missing
 * binding as "not on Workers" and fall back to local behavior.
 *
 * getCloudflareContext() throws outside a request, which is why nothing may
 * call this at module scope.
 */
export function cfEnv(): CloudflareEnv | undefined {
  try {
    return getCloudflareContext().env;
  } catch {
    return undefined;
  }
}

/**
 * The request-scoped execution context, used as a per-request cache (see
 * src/lib/prisma.ts). Anything derived from a request's bindings belongs here
 * rather than on globalThis, so it cannot leak into the next request.
 */
export function cfCtx(): Record<string, unknown> | undefined {
  try {
    return getCloudflareContext().ctx as unknown as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
