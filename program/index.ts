import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import {
  AccessProtectedHost,
  nextApiRoutePrefixes,
  ProjectEmail,
  WafScannerBlock,
  WebAnalytics,
  WwwRedirect,
  ZoneSecurity,
} from "@parra/cloudflare-pulumi";

const cfg = new pulumi.Config();
// An input, not an output: the domain is registered with Cloudflare Registrar,
// which created and delegated the zone as part of the purchase.
const zoneId = cfg.require("zoneId");
const accountId = cfg.require("accountId");
const destination = cfg.get("destination") ?? "ian@parra.io";

// Doubles as each resource's logical name, so it must stay stable.
const domain = "fantasyfootballdraftorder.com";

new WebAnalytics(domain, { accountId, zoneId });

// GA4 is injected by the Worker, not a GoogleAnalytics Snippet: Snippets need a
// paid zone plan, and @parra/cloudflare-pulumi >= 1.14.0 throws on a Free zone.
new ZoneSecurity({ zoneId, domain });
new WwwRedirect({ zoneId, domain });

// custom-worker.ts short-circuits the same scanner paths as a second line of
// defense in case this rule is ever missing.
//
// Unknown /api paths are blocked too: the allow list is generated from the
// Next app's route.ts files under src/app/api, so a new route is covered on
// the next infra deploy. The storybook host is a separate Worker, so only the
// apex and www (both served by this app's Worker) are scoped.
const apiRoutes = nextApiRoutePrefixes([path.join(__dirname, "../src/app")]);
new WafScannerBlock(domain, {
  zoneId,
  knownApiPrefixes: apiRoutes,
  apiHosts: [domain, `www.${domain}`],
});

// Inbound only: drafts are shared by URL and creatorEmail is only stored, so
// the app sends no mail.
new ProjectEmail(domain, { zoneId, domain, destination });

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
