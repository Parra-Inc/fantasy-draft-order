import * as path from "path";
import * as cloudflare from "@pulumi/cloudflare";
import * as pulumi from "@pulumi/pulumi";
import {
  AccessProtectedHost,
  ManagedZone,
  nextApiRoutePrefixes,
  ProjectEmail,
  ZoneBaseline,
} from "@parra/cloudflare-pulumi";

const cfg = new pulumi.Config();
const accountId = cfg.require("accountId");
const destination = cfg.get("destination") ?? "ian@parra.io";

// Doubles as each resource's logical name, so it must stay stable.
const domain = "fantasyfootballdraftorder.com";

// The zone was created by Cloudflare Registrar with the domain purchase, so it
// is adopted (import) rather than created. ManagedZone also declares the
// www-to-apex WwwRedirect, under the same URN the stack-root
// `new WwwRedirect(...)` had, so dropping that line is a no-op.
// The id is only used to build import ids, which must be plain strings.
const zoneImportId = "ff48b5fdfdefac36c5b755b167e7ee22";
const zone = new ManagedZone({ accountId, domain }, { import: zoneImportId });
const zoneId = zone.id;

// GA4 is injected by the Worker, not a GoogleAnalytics Snippet: Snippets need a
// paid zone plan, and @parra/cloudflare-pulumi >= 1.14.0 throws on a Free zone.
//
// ZoneBaseline = ZoneSecurity, WafScannerBlock, WafRateLimit, AgentDiscovery
// (DNSSEC + DNS-AID SVCB; Registrar is Cloudflare so the DS record is
// automatic) and WebAnalytics. Each child aliases its old stack-root URN, so
// this adopts the existing resources; only the rate limit rule is new.
//
// Scanner block: custom-worker.ts short-circuits the same scanner paths as a
// second line of defense. Unknown /api paths are blocked too: the allow list is
// generated from the Next app's route.ts files under src/app/api, so a new
// route is covered on the next infra deploy. The storybook host is a separate
// Worker, so only the apex and www (both served by this app's Worker) are
// scoped.
const apiRoutes = nextApiRoutePrefixes([path.join(__dirname, "../src/app")]);
new ZoneBaseline(domain, {
  accountId,
  zoneId,
  domain,
  scannerBlock: {
    knownApiPrefixes: apiRoutes,
    apiHosts: [domain, `www.${domain}`],
  },
  // There is no sign-in, so the one free-plan rule goes on the anonymous write
  // endpoints that create rows in D1. Presence heartbeats are excluded: an
  // open draft page posts them on a timer.
  rateLimit: {
    expression:
      '(http.request.method eq "POST" and (http.request.uri.path in {"/api/drafts" "/api/feedback" "/api/punishment-ideas" "/api/punishments"} or starts_with(http.request.uri.path, "/api/drafts/import/")))',
    description: "Anonymous write endpoints",
  },
  skip: { wwwRedirect: "declared by ManagedZone" },
});

// Inbound only: drafts are shared by URL and creatorEmail is only stored, so
// the app sends no mail.
//
// DMARC: ProjectEmail declares p=reject by default. The _dmarc TXT record
// already exists (added in the dashboard, never in this stack), so it is
// adopted by id instead of colliding with a create. TTL 1 (auto) matches it.
new ProjectEmail(domain, {
  zoneId,
  domain,
  destination,
  dmarcTtl: 1,
  dmarcImportId: `${zoneImportId}/d331997d3f03440ae7d516dd2a787be2`,
});

// Search Console ownership. Adopted, not created: the TXT record already
// exists live, so it is imported by id. Content keeps the surrounding quotes
// and there is no comment because that is exactly what the API returns; any
// difference would show as an update on import. Preview still shows a one-time
// state-only update (+allowOverwrite false, +content): provider 5.x import does
// not populate those fields, so the value written is identical to live.
new cloudflare.Record(
  `${domain}-google-site-verification`,
  {
    zoneId,
    name: domain,
    type: "TXT",
    content:
      '"google-site-verification=zy6Vu51KCUexXLRb9o_Owu-gi9_pO_EyNmmbd5uS9Us"',
    ttl: 3600,
  },
  { import: `${zoneImportId}/083d02debab43fa32287120e96a80c6b` },
);

// ---------------------------------------------------------------------------
// Storybook, gated by Cloudflare Access.
//
// The Storybook is served static by an assets-only Worker (see
// storybook.wrangler.jsonc, deployed by the deploy-storybook CI job).
// AccessProtectedHost puts a self-hosted Access application in front of the
// hostname, allowing only the Parra Team group. The origin serves no auth
// code; Access does it at the edge.
//
// Requires CLOUDFLARE_GLOBAL_API_KEY + CLOUDFLARE_EMAIL in the deploy
// environment (Access has no working scoped-token write path).
//
// Go-live order matters: this application must exist before the Custom
// Domain route in storybook.wrangler.jsonc resolves, or there is a window
// where storybook.fantasyfootballdraftorder.com serves the build with no
// auth in front of it. `pulumi up` (this job) runs before deploy-storybook
// in deploy.yml on purpose, so the ordering holds on every push to main.
new AccessProtectedHost("storybook.fantasyfootballdraftorder.com", {
  accountId,
  domain: "storybook.fantasyfootballdraftorder.com",
  appName: "Fantasy Football Draft Order Storybook",
});

// ---------------------------------------------------------------------------
// D1 database (binding DB in wrangler.jsonc). Adopted, not created: it already
// exists and holds every draft, so it is protected. The name and id must match
// wrangler.jsonc. Migrations stay with `wrangler d1 migrations apply`.
const d1DatabaseId = "8aa0ab93-44d4-405d-bb49-4c077cf97c55";
const db = new cloudflare.D1Database(
  "fantasy-draft-order-db-production",
  { accountId, name: "fantasy-draft-order-db-production" },
  {
    import: `${accountId}/${d1DatabaseId}`,
    // primaryLocationHint is create-only; the API does not echo it back.
    ignoreChanges: ["primaryLocationHint"],
    protect: true,
  },
);

export const d1DatabaseIdOutput = db.id;
