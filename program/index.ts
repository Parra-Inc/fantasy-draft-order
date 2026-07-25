import * as pulumi from "@pulumi/pulumi";
import {
  EmailForward,
  WebAnalytics,
  WafScannerBlock,
} from "@parra/cloudflare-pulumi";

const cfg = new pulumi.Config();
const zoneId = cfg.require("zoneId");
const accountId = cfg.require("accountId");
const destination = cfg.get("destination") ?? "ian@parra.io";

// The site domain. Also used verbatim as each resource's logical name, so it
// must stay stable to avoid Pulumi replacing existing resources.
const domain = "fantasyfootballdraftorder.com";

// Auth: standard resources use the scoped CLOUDFLARE_API_TOKEN from the env.
// WebAnalytics is the exception - RUM has no API-token permission group, so the
// component calls the REST API itself using CLOUDFLARE_GLOBAL_API_KEY +
// CLOUDFLARE_EMAIL (exported by the shared pulumi.yml workflow).

// Cloudflare Web Analytics (RUM). This replaces @vercel/analytics, which was
// removed from src/app/layout.tsx in the Cloudflare migration: the zone is
// proxied, so Cloudflare injects the beacon at the edge and the app ships no
// analytics script at all. View under Analytics & Logs -> Web Analytics.
new WebAnalytics(domain, {
  accountId,
  zoneId,
});

// Block vulnerability-scanner probes (.env, .php, wp-login.php, .git, backup
// files, ...) at the edge, before they ever reach the Worker. Blocked here,
// these never count as Worker requests/CPU time. custom-worker.ts
// short-circuits the same paths as a second line of defense in case this WAF
// rule is ever missing (new zone, state drift, etc).
new WafScannerBlock(domain, {
  zoneId,
});

// Forward hello@fantasyfootballdraftorder.com to the shared destination. The
// destination itself is verified once by the cloudflare-account stack, not
// here. The forwarding rule is created regardless; delivery starts once
// verified.
//
// The app does not send email — drafts are shared by URL and creatorEmail is
// only stored — so this is inbound only.
new EmailForward(domain, {
  zoneId,
  domain,
  destination,
  forwards: ["hello"],
});
