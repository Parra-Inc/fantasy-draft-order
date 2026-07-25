/**
 * The "also built by me" shelf shown on /d/[slug].
 *
 * Single source of truth for the promoted apps. Deliberately hand-curated and
 * static: this is not ad inventory, it is a short list of things the same author
 * built. That framing is the only reason it belongs on a page whose entire value
 * proposition is that it cannot be questioned, so keep it small, keep it honest,
 * and never let it look like a third-party network.
 *
 * ICONS
 * -----
 * `/public/img/apps/*.png` are 512px copies of each app's real icon. Take them
 * from the authoritative source, which is NOT another repo's marketing site:
 *   - Shipped apps: the live App Store artwork.
 *       curl -s 'https://itunes.apple.com/lookup?id=<trackId>' | jq -r '.results[0].artworkUrl512'
 *   - Unshipped apps: that project's own icon export (e.g. diy-project's
 *     `assets/exports/icon/icon.png`), downsized with `sips -Z 512`.
 * Copying from parra-api-server's portfolio is how diy.png first landed here as
 * a stale hammer-era icon that had already been redrawn upstream. Portfolio
 * sites drift; the store listing and the source repo do not.
 *
 * HOW TO HIDE / SHOW AN APP
 * -------------------------
 * Every promo has a `live` boolean. `PROMOS` is the raw list; every render site
 * iterates `livePromos` instead, so an app can be fully wired up (icon, copy,
 * link) while staying hidden until it ships. Flip `live` on launch and nothing
 * else needs to change. The Playbook is the pending case: same audience as this
 * site, no App Store listing yet.
 */

export type Promo = {
  /** Stable slug, used for React keys and the utm_content detail. */
  key: string;
  name: string;
  /** One short line. Rendered under the name, so no trailing period needed. */
  tagline: string;
  /** Icon under /public/img/apps. Square, rendered at 40px. */
  icon: string;
  /** Destination. App Store listing where there is one, else the marketing site. */
  url: string;
  /**
   * `app-store` gets Apple's campaign params appended and a "Free on the App
   * Store" affordance; `web` gets neither, because Apple's params are
   * meaningless off-store and the CTA has to promise something different.
   */
  destination: "app-store" | "web";
  /**
   * Overrides the CTA line rendered under the tagline. The default for an
   * `app-store` promo claims the app is free, which is only true of some of
   * them, so anything with a price or a paywall sets this instead of shipping a
   * claim the store listing contradicts.
   */
  cta?: string;
  /** See file header. */
  live: boolean;
};

export const PROMOS: Promo[] = [
  {
    key: "only-recipes",
    name: "Only Recipes",
    tagline: "Just the recipe from any site. Sort the draft night food out.",
    icon: "/img/apps/only-recipes.png",
    url: "https://apps.apple.com/us/app/only-recipes-recipe-keeper/id1553858589",
    destination: "app-store",
    live: true,
  },
  {
    key: "diyproject",
    name: "DIYProject.ai",
    tagline: "AI-powered planner for home projects and maintenance.",
    icon: "/img/apps/diy.png",
    url: "https://diyproject.ai",
    destination: "web",
    live: true,
  },
  {
    key: "skimmer",
    name: "Skimmer",
    tagline: "Pool care log for water chemistry, equipment, and service history.",
    icon: "/img/apps/skimmer.png",
    url: "https://apps.apple.com/us/app/skimmer-pool-care-log/id6775022955",
    destination: "app-store",
    cta: "Download on the App Store",
    live: true,
  },
  {
    key: "the-playbook",
    name: "The Playbook",
    tagline: "Learn football IQ in five minutes a day. Win the league next year.",
    icon: "/img/apps/the-playbook.png",
    url: "",
    destination: "app-store",
    // Not on the App Store yet. Best audience match on the shelf: ship it before
    // draft season and flip this, then drop the icon into /public/img/apps.
    live: false,
  },
];

export const livePromos = PROMOS.filter((p) => p.live);

/**
 * Provider token from App Store Connect (App Analytics > Acquisition >
 * Campaigns). Same value across every app, shared with the BleepingSwift unit,
 * so store-side attribution lands in the same place.
 */
const APP_STORE_PROVIDER_TOKEN = "128415653";

/** Campaign id, so this site's installs are separable from BleepingSwift's. */
const APP_STORE_CAMPAIGN_ID = "fantasy_draft_order";

/**
 * Appends attribution to a promo's URL.
 *
 * Apple ignores `utm_*` and web analytics ignores `pt`/`ct`, so App Store links
 * carry both and web links carry only the UTMs. `surface` distinguishes the
 * waiting room from the results page, which is the comparison worth having:
 * pre-draw traffic is a captive countdown, post-draw traffic is a link someone
 * pasted into a group chat.
 */
export function promoHref(promo: Promo, surface: "pre-draw" | "results") {
  if (!promo.url) return "";
  const params = new URLSearchParams({
    utm_source: "fantasyfootballdraftorder",
    utm_medium: surface,
    utm_campaign: "also_built_by_me",
    utm_content: promo.key,
  });
  if (promo.destination === "app-store") {
    params.set("pt", APP_STORE_PROVIDER_TOKEN);
    params.set("ct", APP_STORE_CAMPAIGN_ID);
    params.set("mt", "8");
  }
  return `${promo.url}?${params.toString()}`;
}
