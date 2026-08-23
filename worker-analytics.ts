/**
 * Google Analytics 4, injected into the HTML at the edge by this Worker.
 *
 * WHY HERE AND NOT A CLOUDFLARE SNIPPET: Snippets are gated on the ZONE plan
 * (Free: 0 snippets, Pro: 25). Every zone in this account is Free, and creating
 * one fails with `snippets are not allowed`. Workers have no such gate and this
 * account is already on Workers Paid, so the same HTMLRewriter rewrite costs
 * nothing extra.
 *
 * WHY NOT `@next/third-parties` IN THE APP: a NEXT_PUBLIC_* measurement id has
 * to be listed in every turbo task's `env` array as well as the workflow, and
 * turbo silently scrubs what it was not told about. The failure mode is a build
 * that succeeds with the tag compiled out. Here the id is a runtime binding, so
 * the build never sees it and cannot drop it.
 *
 * The id is PUBLIC (it ships in the page HTML), so it lives in `vars` in
 * wrangler.jsonc rather than in a secret.
 */

/**
 * EU 27 plus the three non-EU EEA states plus the UK. Switzerland is absent on
 * purpose: the revFADP has no prior-consent requirement, so denying storage
 * there would cost real measurement for no legal benefit.
 */
const CONSENT_DENIED_REGIONS = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "IS",
  "LI",
  "NO",
  "GB",
];

/**
 * HTMLRewriter, declared locally so this file drops into any repo unchanged.
 * Several of these apps deliberately keep @cloudflare/workers-types out of the
 * Next.js type graph (it breaks the app build), so a global reference is not
 * available everywhere. Only the streaming-append surface used below is typed.
 */
declare const HTMLRewriter: {
  new (): {
    on(
      selector: string,
      handlers: { element?(element: { append(c: string, o?: { html?: boolean }): void }): void },
    ): { transform(response: Response): Response };
  };
};

export interface InjectGaOptions {
  /**
   * Every domain in this property's user journey, for cross-domain measurement.
   * Pass the SAME list and the same id to each domain in a cluster, or the
   * destination records a self-referral and the funnel's acquisition source is
   * lost. Omit for a single-domain product.
   */
  linkerDomains?: string[];
  /** Consent Mode v2 denial across the EEA/UK. Default true. */
  euConsentDefaultDenied?: boolean;
  /** Path prefixes never tagged. `/api` and `/_next` are always excluded. */
  excludePathPrefixes?: string[];
}

const ALWAYS_EXCLUDED_PREFIXES = ["/api", "/_next"];

function buildTagHtml(
  measurementId: string,
  linkerDomains: string[],
  euDenied: boolean,
): string {
  // Consent ordering: the unrestricted default first, the region-scoped one
  // second. Consent Mode resolves the most specific region match regardless of
  // order, but this reads as the actual policy: granted unless listed.
  const consent = euDenied
    ? `gtag('consent','default',{'ad_storage':'granted','ad_user_data':'granted','ad_personalization':'granted','analytics_storage':'granted'});` +
      `gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','region':${JSON.stringify(CONSENT_DENIED_REGIONS)}});`
    : "";

  const config =
    linkerDomains.length > 0
      ? `gtag('config','${measurementId}',{'linker':{'domains':${JSON.stringify(linkerDomains)}}});`
      : `gtag('config','${measurementId}');`;

  return (
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>` +
    `<script>window.dataLayer=window.dataLayer||[];` +
    `function gtag(){dataLayer.push(arguments);}` +
    consent +
    `gtag('js',new Date());` +
    config +
    `</script>`
  );
}

/**
 * Wraps a response, appending the GA tag to <head> when it is an HTML document.
 *
 * Returns the response untouched when there is no measurement id, so a
 * deployment without the var configured is a silent no-op rather than an error.
 *
 * The content-type check is not redundant with the path check: the path is
 * known before the response exists, so an extensionless route that turns out to
 * serve JSON or an image would otherwise be handed to HTMLRewriter.
 */
export function injectGoogleAnalytics(
  request: Request,
  response: Response,
  measurementId: string | undefined,
  options: InjectGaOptions = {},
): Response {
  const id = measurementId?.trim();
  if (!id) return response;

  // Guard against a misconfigured var silently reporting nowhere: a Google Tag
  // (GT-) or Universal Analytics (UA-) id loads without error and never records.
  if (!/^G-[A-Z0-9]{6,}$/.test(id)) return response;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const url = new URL(request.url);
  const excluded = [
    ...ALWAYS_EXCLUDED_PREFIXES,
    ...(options.excludePathPrefixes ?? []),
  ];
  if (excluded.some((p) => url.pathname.startsWith(p))) return response;

  const tag = buildTagHtml(
    id,
    options.linkerDomains ?? [],
    options.euConsentDefaultDenied ?? true,
  );

  return new HTMLRewriter()
    .on("head", {
      element(element) {
        element.append(tag, { html: true });
      },
    })
    .transform(response);
}
