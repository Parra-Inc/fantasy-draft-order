import * as pulumi from "@pulumi/pulumi";
import {
  EmailForward,
  GoogleAnalytics,
  WafScannerBlock,
  WebAnalytics,
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

// GA4, injected at the edge by a Snippet. Creates nothing until the GA4
// property exists and the GA_MEASUREMENT_ID repo variable is set:
//   gh variable set GA_MEASUREMENT_ID --body G-XXXXXXXXXX
// `||` not `??`: an unset GitHub variable arrives as "", not undefined.
// See cloudflare-infra/docs/GOOGLE-ANALYTICS.md.
new GoogleAnalytics(domain, { zoneId, measurementId: process.env.GA_MEASUREMENT_ID || cfg.get("gaMeasurementId") });
new ZoneSecurity({ zoneId, domain });

// custom-worker.ts short-circuits the same scanner paths as a second line of
// defense in case this rule is ever missing.
new WafScannerBlock(domain, { zoneId });

// Inbound only: drafts are shared by URL and creatorEmail is only stored, so
// the app sends no mail.
new EmailForward(domain, { zoneId, domain, destination, forwards: ["hello"] });
