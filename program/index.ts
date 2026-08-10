import * as pulumi from "@pulumi/pulumi";
import {
  EmailForward,
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
new ZoneSecurity({ zoneId, domain });

// custom-worker.ts short-circuits the same scanner paths as a second line of
// defense in case this rule is ever missing.
new WafScannerBlock(domain, { zoneId });

// Inbound only: drafts are shared by URL and creatorEmail is only stored, so
// the app sends no mail.
new EmailForward(domain, { zoneId, domain, destination, forwards: ["hello"] });
