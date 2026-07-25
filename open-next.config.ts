import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * Without an incremental cache configured, OpenNext has nowhere to read
 * prerendered output back from and every static page 500s in the worker —
 * only dynamic routes render. So one is required even though this app has no
 * ISR: the marketing pages, guides and landing pages are all prerendered.
 *
 * staticAssetsIncrementalCache serves that prerendered output straight from
 * the ASSETS binding. It is read-only by design, which is exactly right here:
 * nothing revalidates on demand, and every database-backed route
 * (/d/[slug], the API routes, sitemap.xml) is force-dynamic. Swap this for
 * r2IncrementalCache if the app ever adopts ISR or "use cache".
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
