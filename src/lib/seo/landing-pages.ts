export type LandingPage = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  h1Accent?: string;
  intro: string;
  keywords: string[];
  highlightPlatform?: string;
  faqs: { q: string; a: string }[];
  breadcrumbName: string;
};

const TRUST_FAQ = {
  q: "How do I know the draft order is actually random?",
  a: "Every draft records its seed, timestamps, and the exact source-code commit that produced the order. The randomizer lives at src/lib/randomizer.ts on GitHub — a Fisher–Yates shuffle driven by Node's crypto.randomInt. Anyone can reproduce and audit the result.",
};

const COMMISSIONER_FAQ = {
  q: "Can the commissioner re-roll or tamper with the order?",
  a: "No. Once a draft is scheduled, teams and time are frozen. There are no edit endpoints. The draw fires automatically at the scheduled time, server-side, and results are permanent.",
};

const FREE_FAQ = {
  q: "Is it really free?",
  a: "Yes. No accounts, no paywalls, no credit card. We're open source and ad-free. If you want to support it, star the GitHub repo.",
};

export const LANDING_PAGES: LandingPage[] = [
  // Platform pages
  {
    slug: "sleeper",
    title: "Sleeper Draft Order Randomizer — Free & Transparent",
    description:
      "Randomize your Sleeper fantasy league's draft order the fair way. Paste your Sleeper league ID, we pull your teams and owners, and the whole league watches the order drawn live from open-source code.",
    eyebrow: "Sleeper",
    h1: "Sleeper draft order randomizer.",
    h1Accent: "Drawn live. Auditable forever.",
    intro:
      "Sleeper's built-in randomize button works — but nobody on your league can verify it. Fantasy Draft Order imports your Sleeper teams by league ID, schedules a public draw time, and runs the order from open-source code with a permanent seed and commit hash. No commissioner in the loop.",
    keywords: [
      "sleeper draft order randomizer",
      "sleeper fantasy draft order",
      "how to randomize draft order on sleeper",
      "fair sleeper draft order",
    ],
    highlightPlatform: "Sleeper",
    breadcrumbName: "Sleeper",
    faqs: [
      {
        q: "Does this connect to my Sleeper account?",
        a: "No OAuth, no login. We use Sleeper's public read-only API with your league ID. We pull team names, owner names, and avatars — nothing about your account.",
      },
      {
        q: "Where do I find my Sleeper league ID?",
        a: "Open your league in Sleeper's web app. The league ID is the long number in the URL — e.g. sleeper.com/leagues/123456789. Paste the whole URL or just the ID; we'll accept either.",
      },
      {
        q: "Can I still use Sleeper's built-in randomizer instead?",
        a: "You can, but only the commissioner sees it fire. Fantasy Draft Order is the tool you reach for when your league wants a single scheduled reveal time and a permanent, shareable audit trail everyone can verify.",
      },
      TRUST_FAQ,
      COMMISSIONER_FAQ,
      FREE_FAQ,
    ],
  },
  {
    slug: "espn",
    title: "ESPN Fantasy Draft Order Randomizer — Free, Live, Open Source",
    description:
      "Randomize your ESPN fantasy league's draft order and share one link. Public ESPN leagues import by league ID. Whole league watches it drawn live from open-source code.",
    eyebrow: "ESPN",
    h1: "ESPN fantasy draft order, done right.",
    h1Accent: "Scheduled. Synced. Tamper-proof.",
    intro:
      "ESPN auto-randomizes your draft order an hour before the draft — if nobody sets it first. That moment is invisible, unverifiable, and the commissioner can re-run it. Fantasy Draft Order replaces that black box with a public, scheduled draw: paste your ESPN league ID, share the link, and the whole league watches the order come out of open-source code at a pre-announced time.",
    keywords: [
      "espn fantasy draft order",
      "espn draft order randomizer",
      "randomize espn fantasy draft",
      "espn fantasy league draft order",
    ],
    highlightPlatform: "ESPN",
    breadcrumbName: "ESPN",
    faqs: [
      {
        q: "Which ESPN leagues are supported?",
        a: "Public ESPN leagues can be imported by league ID. Private leagues can still use Fantasy Draft Order by entering team and owner names manually on the create form.",
      },
      {
        q: "Where do I find my ESPN league ID?",
        a: "Open your ESPN fantasy league in a browser. The league ID is in the URL — e.g. fantasy.espn.com/football/league?leagueId=123456. Paste the whole URL or just the ID.",
      },
      {
        q: "Do I still set draft order in ESPN?",
        a: "Yes. Use Fantasy Draft Order to produce the authoritative random order with a public record, then manually enter that order into your ESPN league settings before the draft.",
      },
      TRUST_FAQ,
      COMMISSIONER_FAQ,
      FREE_FAQ,
    ],
  },
  {
    slug: "yahoo",
    title: "Yahoo Fantasy Draft Order Randomizer — Free, Live, Auditable",
    description:
      "Generate a fair, public fantasy draft order for your Yahoo league. Add your team names, schedule a time, and watch the order drawn live from open-source code.",
    eyebrow: "Yahoo",
    h1: "Yahoo fantasy draft order, out in the open.",
    h1Accent: "No commish black box.",
    intro:
      "Yahoo doesn't expose a public league API, so Fantasy Draft Order uses manual entry for Yahoo leagues — type in your teams and owners once, and everything else is identical: scheduled draw, synchronized reveal, permanent seed and commit, no way for the commissioner to re-roll.",
    keywords: [
      "yahoo fantasy draft order",
      "yahoo draft order randomizer",
      "yahoo fantasy league draft randomizer",
    ],
    breadcrumbName: "Yahoo",
    faqs: [
      {
        q: "Can you import from Yahoo directly?",
        a: "Not yet — Yahoo's API requires OAuth and we don't do accounts. For Yahoo leagues, add your teams manually. The whole process takes less than a minute.",
      },
      {
        q: "How do I get the final order into Yahoo?",
        a: "After the live draw, the draft page shows the permanent order. Open your Yahoo league settings and enter that order as the draft pick order before the draft starts.",
      },
      TRUST_FAQ,
      COMMISSIONER_FAQ,
      FREE_FAQ,
    ],
  },
  {
    slug: "mfl",
    title: "MyFantasyLeague (MFL) Draft Order Randomizer — Free & Open Source",
    description:
      "Fair, transparent fantasy draft order for your MyFantasyLeague league. Import by league ID, schedule a time, and share one link the whole league can watch.",
    eyebrow: "MyFantasyLeague",
    h1: "MFL draft order, verifiable by everyone.",
    h1Accent: "Not just the commish.",
    intro:
      "MyFantasyLeague has deep controls — which makes it easy for a commissioner to quietly re-randomize until they like the result. Fantasy Draft Order takes that possibility off the table: paste your MFL league ID, schedule a public draw, and the order comes out of open-source code at the exact scheduled second.",
    keywords: [
      "myfantasyleague draft order",
      "mfl draft order randomizer",
      "mfl fantasy draft order",
    ],
    highlightPlatform: "MyFantasyLeague",
    breadcrumbName: "MyFantasyLeague",
    faqs: [
      {
        q: "Where do I find my MFL league ID?",
        a: "Open your MFL home page. The URL contains both the year and league ID — e.g. www46.myfantasyleague.com/2026/home/12345. Paste the URL and we'll extract the ID.",
      },
      {
        q: "Does MFL have to be configured in any special way?",
        a: "No. We read public league data through MFL's API. No credentials, no OAuth.",
      },
      TRUST_FAQ,
      COMMISSIONER_FAQ,
      FREE_FAQ,
    ],
  },
  {
    slug: "fleaflicker",
    title: "Fleaflicker Draft Order Randomizer — Free, Live, Auditable",
    description:
      "Randomize your Fleaflicker fantasy league's draft order and share one link. The whole league watches the order drawn live from open-source code.",
    eyebrow: "Fleaflicker",
    h1: "Fleaflicker draft order, drawn in public.",
    h1Accent: "With a permanent record.",
    intro:
      "Fleaflicker's randomizer happens inside the commissioner's dashboard. Fantasy Draft Order lifts the draw out of the dashboard and into a scheduled, shareable page. Paste your Fleaflicker league ID, pick a time, and the whole league watches the same animation at the same second with a seed everyone can verify.",
    keywords: [
      "fleaflicker draft order",
      "fleaflicker draft order randomizer",
      "fleaflicker fantasy draft",
    ],
    highlightPlatform: "Fleaflicker",
    breadcrumbName: "Fleaflicker",
    faqs: [
      {
        q: "How do I find my Fleaflicker league ID?",
        a: "Open your Fleaflicker league in a browser. The league ID is in the URL — e.g. fleaflicker.com/nfl/leagues/123456. Paste the URL and we'll extract it.",
      },
      TRUST_FAQ,
      COMMISSIONER_FAQ,
      FREE_FAQ,
    ],
  },

  // Sport pages
  {
    slug: "fantasy-football",
    title:
      "Fantasy Football Draft Order Generator — Free, Fair, Open Source",
    description:
      "Free fantasy football draft order generator. Schedule a draw, share one link, and watch the order drawn live from open-source code. 8, 10, 12, 14 teams — any league size.",
    eyebrow: "Fantasy football",
    h1: "Fantasy football draft order,",
    h1Accent: "your league can trust.",
    intro:
      "The most common league arguments of the year happen before a pick is made: who got slot 1, did the commish really randomize it, why can't we see how. Fantasy Draft Order ends the argument. Schedule a public draw at a time your league picks. Import from Sleeper, ESPN, MyFantasyLeague, or Fleaflicker — or add teams manually. Everyone watches the same live reveal.",
    keywords: [
      "fantasy football draft order generator",
      "fantasy football draft randomizer",
      "nfl fantasy draft order",
      "10 team fantasy football draft order",
      "12 team fantasy football draft order",
    ],
    breadcrumbName: "Fantasy football",
    faqs: [
      {
        q: "Does it work for any league size?",
        a: "Yes — any size. 4, 6, 8, 10, 12, 14, 16, 20 — whatever your league uses. Add teams manually or import from a supported platform and we preserve whatever roster you have.",
      },
      {
        q: "Snake draft, auction draft, linear draft?",
        a: "Fantasy Draft Order produces the pick order — slot 1 through slot N. Your league can then use that order for a snake, linear, or auction nomination sequence in whatever platform you actually draft on.",
      },
      TRUST_FAQ,
      COMMISSIONER_FAQ,
      FREE_FAQ,
    ],
  },
  {
    slug: "fantasy-basketball",
    title: "Fantasy Basketball Draft Order Generator — Free & Transparent",
    description:
      "Free fantasy basketball draft order generator for NBA leagues. Schedule a draw, share one link, and the whole league watches it live from open-source code.",
    eyebrow: "Fantasy basketball",
    h1: "Fantasy basketball draft order.",
    h1Accent: "Fair, live, auditable.",
    intro:
      "Basketball leagues tend to run longer than football ones and the draft order matters more year after year. Fantasy Draft Order gives your NBA fantasy league a public, scheduled draw with a permanent audit trail — so slot 1 isn't in dispute for the entire season.",
    keywords: [
      "fantasy basketball draft order generator",
      "nba fantasy draft order",
      "fantasy basketball randomizer",
    ],
    breadcrumbName: "Fantasy basketball",
    faqs: [
      {
        q: "Is this for head-to-head, roto, or dynasty NBA leagues?",
        a: "All of them. The randomizer produces a fair pick order; your league chooses what to do with it.",
      },
      TRUST_FAQ,
      COMMISSIONER_FAQ,
      FREE_FAQ,
    ],
  },
  {
    slug: "fantasy-baseball",
    title: "Fantasy Baseball Draft Order Generator — Free, Fair, Open Source",
    description:
      "Free fantasy baseball draft order generator for MLB leagues. Schedule a draw, share one link, and the whole league watches it drawn live from open-source code.",
    eyebrow: "Fantasy baseball",
    h1: "Fantasy baseball draft order,",
    h1Accent: "drawn in public.",
    intro:
      "Fantasy baseball leagues span six months and thirty roster moves a week. The draft order shouldn't be the thing people still argue about in July. Schedule a public draw now. Let everyone watch. Move on.",
    keywords: [
      "fantasy baseball draft order generator",
      "mlb fantasy draft order",
      "fantasy baseball randomizer",
    ],
    breadcrumbName: "Fantasy baseball",
    faqs: [
      {
        q: "Does this handle keeper and dynasty baseball leagues?",
        a: "Yes. Fantasy Draft Order generates a pick order regardless of format. Dynasty and keeper leagues typically use it for rookie drafts — schedule the draw, everyone watches live.",
      },
      TRUST_FAQ,
      COMMISSIONER_FAQ,
      FREE_FAQ,
    ],
  },
  {
    slug: "fantasy-hockey",
    title: "Fantasy Hockey Draft Order Generator — Free & Transparent",
    description:
      "Free fantasy hockey draft order generator for NHL leagues. Schedule a draw, share one link, and the whole league watches it live from open-source code.",
    eyebrow: "Fantasy hockey",
    h1: "Fantasy hockey draft order.",
    h1Accent: "No back-room randomize.",
    intro:
      "NHL fantasy leagues are smaller, tighter, and everyone knows everyone. That makes a disputed draft order extra awkward. Fantasy Draft Order takes the dispute off the table: schedule a draw, everyone opens the same link, and the order comes out of open-source code with a permanent receipt.",
    keywords: [
      "fantasy hockey draft order generator",
      "nhl fantasy draft order",
      "fantasy hockey randomizer",
    ],
    breadcrumbName: "Fantasy hockey",
    faqs: [
      TRUST_FAQ,
      COMMISSIONER_FAQ,
      FREE_FAQ,
    ],
  },

  // Use-case pages
  {
    slug: "draft-lottery",
    title:
      "Fantasy Draft Lottery — Free, Sealed, Open-Source Random Draft Order",
    description:
      "Run a sealed fantasy draft lottery. Schedule the reveal, share one link, and let every team watch the order drawn live from open-source code. No re-rolls, no commissioner in the loop.",
    eyebrow: "Draft lottery",
    h1: "A fantasy draft lottery",
    h1Accent: "nobody can rig.",
    intro:
      "A lottery is only fair if the results are truly sealed until the reveal and truly unalterable after. Most fantasy draft lottery tools sell you trust. Fantasy Draft Order proves it. The randomizer is open source, the seed is recorded, and once a draft is scheduled there are no edit endpoints — even the commissioner can't touch it.",
    keywords: [
      "fantasy draft lottery",
      "sealed fantasy draft lottery",
      "fantasy draft lottery simulator",
      "fair fantasy draft lottery",
    ],
    breadcrumbName: "Draft lottery",
    faqs: [
      {
        q: "Is this a weighted lottery or a random draw?",
        a: "Today, Fantasy Draft Order runs a uniform random draw — every team has equal odds at every slot. Weighted NBA-style lotteries are on the roadmap.",
      },
      {
        q: "How is this different from a draft lottery simulator that runs in the browser?",
        a: "In-browser simulators produce a result nobody else can verify. Fantasy Draft Order runs the draw server-side at a scheduled public time, records the seed and commit hash, and shows the same live reveal to every viewer.",
      },
      TRUST_FAQ,
      COMMISSIONER_FAQ,
      FREE_FAQ,
    ],
  },
  {
    slug: "how-it-works",
    title: "How Fantasy Draft Order Works — Scheduled, Synchronized, Signed",
    description:
      "Three steps: schedule the draw, share the link, watch the order drawn live from open-source code. Here's exactly what happens behind the scenes.",
    eyebrow: "How it works",
    h1: "How a trustworthy draft order",
    h1Accent: "actually works.",
    intro:
      "The product is simple on purpose. One form, one link, one scheduled reveal. But the guarantees underneath — randomness, immutability, synchronization — need some detail. Here's every step and the code that runs it.",
    keywords: [
      "how fantasy draft order works",
      "fantasy draft randomizer explained",
      "fisher-yates draft order",
    ],
    breadcrumbName: "How it works",
    faqs: [
      {
        q: "What algorithm does the randomizer use?",
        a: "Fisher–Yates shuffle, driven by Node's crypto.randomInt — a cryptographically secure PRNG. The implementation is pure and takes a random function as an argument so the tests can inject a deterministic sequence and lock the algorithm's behavior.",
      },
      {
        q: "What's recorded for each draft?",
        a: "The seed, the exact commit SHA of the randomizer when the draw ran, the scheduled time, the started time, and the completed time. Every pick also has a revealedAt timestamp staggered by ~1s so every viewer sees the same animation.",
      },
      {
        q: "What happens if a viewer loses their connection mid-draw?",
        a: "Nothing. The results are committed server-side the moment the draw fires. SWR polling reconnects automatically and catches up to the latest state.",
      },
      TRUST_FAQ,
      COMMISSIONER_FAQ,
    ],
  },
  {
    slug: "why-fair",
    title: "Why Fantasy Draft Order Is Actually Fair — Trust by Design",
    description:
      "Every other draft randomizer asks you to trust the commissioner. We took them out of the loop. Here's the four-pillar trust model.",
    eyebrow: "Why it's fair",
    h1: "Trust, not by promise.",
    h1Accent: "By design.",
    intro:
      "The core problem with every fantasy draft randomizer is that it's an ad-copy promise. \"Cryptographic randomness.\" \"Unbiased.\" \"Trusted by thousands.\" None of that is verifiable. Fantasy Draft Order is built so the promise isn't the product — the proof is.",
    keywords: [
      "fair fantasy draft order",
      "trustworthy fantasy draft randomizer",
      "open source draft randomizer",
      "is my draft order random",
    ],
    breadcrumbName: "Why it's fair",
    faqs: [
      {
        q: "How is this different from RotoWire or FantasyPros' randomizer?",
        a: "Those run in a closed browser session. You click randomize, they show you a result. Nothing is sealed, nothing is scheduled, and nothing can be verified after the fact. Fantasy Draft Order runs the draw server-side at a public scheduled time, records a seed and commit hash, and shows the exact same live reveal to every viewer.",
      },
      TRUST_FAQ,
      COMMISSIONER_FAQ,
      FREE_FAQ,
    ],
  },
];

export function getLandingPage(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug);
}
