import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/**
 * The old Vercel origin. Links to it are already out in the wild (shared draft
 * URLs, search results, the pages that were indexed while it was canonical), so
 * it keeps serving this build and permanently forwards every path to the same
 * path on the canonical host. Only the stable alias is matched: per-deployment
 * and per-branch preview URLs must keep serving themselves.
 */
const LEGACY_HOST = "fantasy-draft-order.vercel.app";
const CANONICAL_ORIGIN = "https://fantasyfootballdraftorder.com";

/**
 * The IndexNow key file, excluded from the redirect above. Redirects are checked
 * before /public files, and IndexNow verifies ownership by fetching this file on
 * the exact host a submission names, so redirecting it would 403 every
 * submission made while PRODUCTION_SITE_URL (src/lib/indexnow.ts) still points
 * at the Vercel origin. Keep it byte-identical to the file in public/.
 */
const INDEXNOW_KEY_FILE = "0d280bb4c994c621118dcd0a691c7c8d.txt";

const nextConfig: NextConfig = {
  // Packages with workerd-specific export conditions must stay out of the Next
  // bundle, or OpenNext's esbuild pass fails to resolve them.
  // https://opennext.js.org/cloudflare/howtos/workerd
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    "@prisma/adapter-d1",
  ],
  async redirects() {
    return [
      {
        source: `/:path((?!${INDEXNOW_KEY_FILE.replace(".", "\\.")}$).*)`,
        has: [{ type: "host", value: LEGACY_HOST }],
        destination: `${CANONICAL_ORIGIN}/:path`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

// Exposes the wrangler.jsonc bindings (D1, ASSETS) inside plain `next dev` via
// miniflare, so the local loop needs no wrangler command and reads the same
// .wrangler/state database that `pnpm db:migrate:local` writes to.
// No-op outside `next dev`.
initOpenNextCloudflareForDev();
