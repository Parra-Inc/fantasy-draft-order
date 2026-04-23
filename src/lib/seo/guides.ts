export type GuideSection =
  | { kind: "h2"; text: string; id?: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "quote"; text: string; cite?: string }
  | { kind: "callout"; tone: "info" | "trust"; text: string }
  | { kind: "code"; text: string; language?: string };

export type Guide = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  datePublished: string;
  dateModified?: string;
  readingMinutes: number;
  category: string;
  keywords: string[];
  sections: GuideSection[];
  faqs: { q: string; a: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "is-your-draft-order-actually-random",
    title: "Is your fantasy draft order actually random?",
    description:
      "Most fantasy draft randomizers ask you to take their word for it. Here's how to tell whether your league's draft order is verifiably random — and what to do when it isn't.",
    excerpt:
      "The phrase \"unbiased random draft order\" is on every randomizer's homepage. Almost none of them can prove it. Here's how to tell.",
    datePublished: "2026-04-15",
    readingMinutes: 6,
    category: "Trust",
    keywords: [
      "is my draft order random",
      "fair fantasy draft order",
      "open source draft randomizer",
      "verify draft order fairness",
    ],
    sections: [
      {
        kind: "p",
        text: "Every fantasy draft randomizer on the internet says the same thing on its homepage: \"unbiased,\" \"random,\" \"fair.\" Almost none of them give you any way to actually check. Here's the short version of what fairness in a draft randomizer means — and the four tests your tool either passes or fails.",
      },
      { kind: "h2", text: "Test 1: Is the algorithm public?" },
      {
        kind: "p",
        text: "If the randomizer is closed-source, the only thing you have is the company's word. That's not random — that's reputation. The minimum bar for a verifiable random draft order is that the shuffling code is published somewhere you can read it.",
      },
      {
        kind: "p",
        text: "Fantasy Draft Order's randomizer lives at src/lib/randomizer.ts on GitHub. It's a Fisher–Yates shuffle, the textbook algorithm for unbiased permutations. Every draft on the site links directly to the exact commit that produced it.",
      },
      { kind: "h2", text: "Test 2: Where does the randomness come from?" },
      {
        kind: "p",
        text: "Math.random() is not random enough for a draft order. It's a fast PRNG seeded by the browser, and its output can be predicted given enough samples. For a draft order — where you only need a few values per draw — the practical risk is low, but the optics are bad: you can't claim cryptographic randomness when you're using a function designed for animations.",
      },
      {
        kind: "p",
        text: "Fantasy Draft Order uses Node's crypto.randomInt — a CSPRNG (cryptographically secure pseudo-random number generator). The seed is recorded with each draft so you can reproduce the result.",
      },
      { kind: "h2", text: "Test 3: Can the commissioner re-roll?" },
      {
        kind: "p",
        text: "This is the one most people miss. Even a perfectly random algorithm gives the commissioner a perfectly fair draft order — and the commissioner can then click randomize again. And again. Until the result is one they like. From the league's perspective, this is identical to manual order picking; the algorithm doesn't matter once a re-roll is possible.",
      },
      {
        kind: "p",
        text: "A trustworthy randomizer needs to either (a) seal the result before anyone sees it, or (b) make the result impossible to discard. Fantasy Draft Order does both. Once a draft is scheduled, teams and time are immutable — there are literally no edit endpoints in the API. The draw fires server-side at the scheduled time and the result is permanent.",
      },
      { kind: "h2", text: "Test 4: Is there a permanent record?" },
      {
        kind: "p",
        text: "After the draft, can your league still verify what happened a year from now? Most randomizers produce a screenshot — at best, an emailed list. Fantasy Draft Order produces a permanent URL with the seed, the timestamps, the source-code commit, and every pick's reveal time stored server-side.",
      },
      {
        kind: "callout",
        tone: "trust",
        text: "If your current draft randomizer can't pass all four tests, you're trusting a person, not a process. That's a fine choice for a casual league. But for any league with money, keepers, or strong opinions, the process should be the thing you trust — not the person who runs it.",
      },
      { kind: "h2", text: "What about RotoWire, FantasyPros, or the in-platform randomizer?" },
      {
        kind: "p",
        text: "RotoWire and FantasyPros are reputable companies, but their draft order tools are closed-source and run in your browser. The result has no audit trail and the commissioner can re-run them silently. Sleeper, ESPN, Yahoo, and MFL all have built-in randomize buttons; they're convenient, but only the commissioner sees them fire and the league has no way to verify the result.",
      },
      {
        kind: "p",
        text: "Fantasy Draft Order solves the verifiability problem specifically. It's not better than these tools at being a fantasy platform — they're better at that. It's better at being the moment of truth before the platform draft starts.",
      },
    ],
    faqs: [
      {
        q: "Is Fisher–Yates really unbiased?",
        a: "Yes — when implemented correctly with a uniform random integer in the right range, Fisher–Yates produces every possible permutation with equal probability. The implementation is a five-line function and tested with deterministic random sources to lock the algorithm.",
      },
      {
        q: "Can I audit the randomizer myself?",
        a: "Yes. Open src/lib/randomizer.ts on GitHub. The function is pure — it takes a random function as an argument so you can prove the algorithm is correct independently of any source of randomness.",
      },
      {
        q: "What if I just trust my commissioner?",
        a: "Most leagues do, and most leagues are fine. Fantasy Draft Order exists for the leagues where the commissioner doesn't want to be trusted — they want the result to be obviously fair without needing anyone to vouch for them.",
      },
    ],
  },
  {
    slug: "fun-ways-to-determine-fantasy-draft-order",
    title: "10 fun ways to determine your fantasy football draft order",
    description:
      "Pizza races, paper airplanes, fantasy combines, NASCAR. Ten creative ways to pick draft order — plus one boring, perfectly fair backup for when the chaos doesn't decide it.",
    excerpt:
      "The funniest part of fantasy football is the draft order ritual. Here are ten of the best ones, ranked by how much beer they require.",
    datePublished: "2026-04-08",
    readingMinutes: 8,
    category: "League traditions",
    keywords: [
      "fun ways to determine fantasy football draft order",
      "fantasy football draft order ideas",
      "creative ways to pick draft order",
    ],
    sections: [
      {
        kind: "p",
        text: "The fastest way to pick a fantasy football draft order is to click randomize. The most fun way is anything but. Here are ten of the best ones — and a backup plan for when your chaos method produces a tie or a fight.",
      },
      { kind: "h2", text: "1. The pizza delivery race" },
      {
        kind: "p",
        text: "Each league member orders the same pizza from a different shop, all at the same time. The order pizzas arrive determines the draft order. Caveat: this requires everyone to live in the same city, and your delivery drivers will be confused.",
      },
      { kind: "h2", text: "2. The paper airplane contest" },
      {
        kind: "p",
        text: "Everyone builds a paper airplane and flies it from the same line. Distance determines slot. Cheap, fast, and the throwing technique arguments alone are worth the price of admission.",
      },
      { kind: "h2", text: "3. NFL trivia tournament" },
      {
        kind: "p",
        text: "Bracket-style trivia, league-themed. The winner gets first pick. This rewards the league members who actually pay attention, which is either great or terrible depending on your group.",
      },
      { kind: "h2", text: "4. The fantasy combine" },
      {
        kind: "p",
        text: "Set up four to six events: 40-yard dash, throwing accuracy, cup pong, cornhole. Total points decide draft order. Best done at the league's preseason BBQ if you have one.",
      },
      { kind: "h2", text: "5. NASCAR finishing order" },
      {
        kind: "p",
        text: "Every league member draws a driver from a hat before the next NASCAR / IndyCar / F1 race. Driver finishing order = draft order. You don't have to watch the race; you just have to live with the result.",
      },
      { kind: "h2", text: "6. Madden tournament" },
      {
        kind: "p",
        text: "Bracket-style Madden, gauntlet seeding. The winner gets slot 1. Works great if half your league refuses, because they get slots in the back of the order by default.",
      },
      { kind: "h2", text: "7. Music shuffle" },
      {
        kind: "p",
        text: "Each league member adds one song to a shared playlist. Hit shuffle. The first song to play decides slot 1, the second decides slot 2, and so on.",
      },
      { kind: "h2", text: "8. The auction" },
      {
        kind: "p",
        text: "Every league member gets the same fake currency, and slots are auctioned off one at a time. Whoever wants slot 1 most pays for it. This works best in keeper leagues where draft slot has long-term value.",
      },
      { kind: "h2", text: "9. The blame draft" },
      {
        kind: "p",
        text: "Last year's last-place team picks first. Last year's first-place team picks last. Cruel, simple, and weirdly motivating mid-season.",
      },
      { kind: "h2", text: "10. The reverse standings draft" },
      {
        kind: "p",
        text: "Same as above but more democratic — everyone's slot matches their inverse standing position from last year. Functionally identical to the NBA's logic before they invented the lottery.",
      },
      { kind: "h2", text: "What if the chaos method doesn't decide it?" },
      {
        kind: "p",
        text: "Three pizzas show up at the same time. Two paper airplanes tie. Your driver gets DNF'd. The fallback for any of these is the same: a public, scheduled, open-source draw that nobody can dispute.",
      },
      {
        kind: "callout",
        tone: "info",
        text: "Schedule a Fantasy Draft Order draw for the night you do your chaos method. If the chaos produces a clean result, ignore the link. If it doesn't, the league has a tamper-proof tiebreaker waiting at the URL.",
      },
    ],
    faqs: [
      {
        q: "Which method is the most fair?",
        a: "Truly fair: a public scheduled random draw with a verifiable seed and source code. The chaos methods above are about ritual, not fairness. Use them for the fun, use Fantasy Draft Order for the receipt.",
      },
      {
        q: "What's the most popular draft order method?",
        a: "Per Sleeper's own community: most leagues just click randomize a few times and accept whatever comes out. About 10–15% do something creative, and the leagues with money usually want a verifiable randomizer.",
      },
    ],
  },
  {
    slug: "snake-vs-straight-draft-order",
    title: "Snake draft vs straight draft: which order should your league use?",
    description:
      "Snake drafts reverse every round. Straight drafts repeat. Here's the difference, when each makes sense, and why almost every fantasy league uses snake.",
    excerpt:
      "Snake draft, straight draft, third-round reversal. Here's what each format actually does to your roster.",
    datePublished: "2026-04-01",
    readingMinutes: 5,
    category: "Draft formats",
    keywords: [
      "snake draft vs straight draft",
      "snake draft fantasy football",
      "straight draft fantasy football",
      "third round reversal draft",
    ],
    sections: [
      {
        kind: "p",
        text: "Almost every fantasy league uses a snake draft. A few use straight drafts. A small number use third-round reversal. The difference matters more than people think — it shapes which slot is actually best, what your roster looks like in the middle rounds, and how aggressively you should pursue trades on draft night.",
      },
      { kind: "h2", text: "Straight draft: the same order every round" },
      {
        kind: "p",
        text: "In a straight draft, the team that picks first in round 1 picks first in every round. Slot 1 picks 1, 13, 25, 37, and so on. Slot 12 picks 12, 24, 36, 48.",
      },
      {
        kind: "p",
        text: "This format compounds the advantage of an early pick. The first team gets every round's best remaining player; the last team gets every round's worst. Fantasy leagues almost never use this format because it's too unbalanced.",
      },
      { kind: "h2", text: "Snake draft: reverse the order every round" },
      {
        kind: "p",
        text: "Snake drafts flip after each round. Slot 1 picks first in round 1 and last in round 2. Slot 12 picks last in round 1 and first in round 2. The pattern resembles a snake — hence the name.",
      },
      {
        kind: "p",
        text: "Total picks per team are equal, but the timing changes. Slot 1 has to wait the longest between picks. Slot 12 gets two picks in a row at the round turn. Most analysts think slots 5–8 are the sweet spot: not far enough back to miss elite talent, not so early that you wait forever for pick two.",
      },
      { kind: "h2", text: "Third-round reversal (3RR)" },
      {
        kind: "p",
        text: "A snake draft variant where the order reverses an extra time after round 2. So the first three rounds go: 1→12, 12→1, 12→1, then resume normal snake. The team with slot 1 gets a third-round pick close to their second-round pick, slightly nerfing the late-round-12 advantage. Increasingly common in dynasty leagues.",
      },
      { kind: "h2", text: "Auction drafts: not really an order at all" },
      {
        kind: "p",
        text: "Worth mentioning: auction drafts don't have a draft order in the traditional sense. Every team has the same budget, and players are nominated in a rotating order. The rotating nomination order is what Fantasy Draft Order can produce for an auction league.",
      },
      { kind: "h2", text: "Which one should your league use?" },
      {
        kind: "ul",
        items: [
          "Redraft fantasy football: snake. It's the standard for a reason.",
          "Dynasty rookie drafts: snake or 3RR. 3RR if your league wants to flatten the value of slot 1 over time.",
          "Keeper leagues: snake, with the keeper round determined by where you drafted that player last year.",
          "Auction leagues: rotating nomination order — Fantasy Draft Order produces the rotation.",
        ],
      },
      {
        kind: "callout",
        tone: "info",
        text: "Whichever format your league uses, the order itself is the thing you want to be unimpeachably fair. Schedule a public draw, share the link, let everyone watch.",
      },
    ],
    faqs: [
      {
        q: "Is slot 1 always best in a snake draft?",
        a: "No. Slot 1 gets the best round-1 pick, but waits 24 picks for round 2. Many drafters prefer slots 5–8 for the balance between elite round-1 talent and reasonable round-2 wait time.",
      },
      {
        q: "Does Fantasy Draft Order produce a snake order or a straight order?",
        a: "It produces a pick order — slot 1 through slot N. Your league chooses what to do with the order on whatever platform you actually draft on.",
      },
    ],
  },
  {
    slug: "weighted-vs-random-draft-lottery",
    title: "Weighted vs random draft lottery: which is fair for your league?",
    description:
      "A random lottery gives every team equal odds. A weighted lottery gives worse teams better odds — like the NBA. Here's which one your league should use, and why.",
    excerpt:
      "The NBA uses a weighted lottery to discourage tanking. Most fantasy leagues use uniform random. Here's the actual case for each.",
    datePublished: "2026-03-25",
    readingMinutes: 5,
    category: "Draft formats",
    keywords: [
      "weighted vs random draft lottery",
      "fantasy draft lottery odds",
      "nba draft lottery fantasy",
      "fantasy draft lottery weighting",
    ],
    sections: [
      {
        kind: "p",
        text: "Two ways to run a fantasy draft lottery: every team has equal odds (uniform random) or worse teams get better odds (weighted, NBA-style). Each is fair under a different definition of fair. Here's which one fits your league.",
      },
      { kind: "h2", text: "Uniform random: simplest, most defensible" },
      {
        kind: "p",
        text: "Every team has 1/N odds at every slot. Last year's standings don't matter. Truly random. Hard to argue with.",
      },
      {
        kind: "p",
        text: "This is the right choice for redraft leagues, because last year's standings already don't matter — every team starts fresh. It's also the right choice for any league where you don't trust the commissioner to pick a weighting scheme without bias.",
      },
      { kind: "h2", text: "Weighted: favors worse teams" },
      {
        kind: "p",
        text: "The NBA's lottery gives the worst three teams the highest odds at the top pick, with diminishing odds for better-finishing teams. The math is designed to discourage tanking while still giving good teams a chance at top picks.",
      },
      {
        kind: "p",
        text: "Most fantasy leagues that use weighted lotteries copy the NBA's structure: 14% odds for the worst team, 14% for the next, 14% for the next, then sloping down. It works best in keeper and dynasty leagues where good teams stay good for years and you want a counter-pressure to dynasties.",
      },
      { kind: "h2", text: "Linear weighting" },
      {
        kind: "p",
        text: "A simpler weighting scheme: the worst team gets N lottery balls, the next gets N-1, down to 1 ball for the best team. Smoother slope than the NBA, easier to explain, slightly less protection against the very-best team getting an early pick anyway.",
      },
      { kind: "h2", text: "Custom weighting" },
      {
        kind: "p",
        text: "Some leagues want to assign specific odds to specific teams — slot guarantees, range protections, top-3 lottery only. This is fair only if it's set in stone before any draft, ideally before the season starts.",
      },
      { kind: "h2", text: "The trust problem with weighted lotteries" },
      {
        kind: "p",
        text: "Weighted lotteries introduce a parameter — the weights — that the commissioner chooses. That choice is itself a potential source of bias. If your league trusts the commissioner to pick the weights fairly, weighted is great. If not, uniform random is the safest move.",
      },
      {
        kind: "callout",
        tone: "trust",
        text: "Fantasy Draft Order today runs uniform random draws. Weighted lotteries (NBA-style and linear) are on the roadmap.",
      },
    ],
    faqs: [
      {
        q: "Does Fantasy Draft Order support weighted lotteries?",
        a: "Not yet. Today, every draft is a uniform random draw. Weighted and tiered lotteries are on the roadmap — track progress on GitHub.",
      },
      {
        q: "Is the NBA lottery actually weighted?",
        a: "Yes. The current system gives the bottom three teams equal 14% odds at the first pick, then progressively lower odds for better teams. The full odds table is published by the NBA.",
      },
    ],
  },
  {
    slug: "how-to-randomize-draft-order-on-sleeper",
    title: "How to randomize draft order on Sleeper (and how to do it better)",
    description:
      "Sleeper has a built-in randomize button for draft order. Here's exactly where to find it, and a verifiable alternative your whole league can watch.",
    excerpt:
      "Sleeper's randomize button is one click. Here's where it is — plus when you should use a public, scheduled draw instead.",
    datePublished: "2026-03-18",
    readingMinutes: 4,
    category: "Platform guides",
    keywords: [
      "how to randomize draft order on sleeper",
      "sleeper draft order",
      "sleeper randomize draft",
    ],
    sections: [
      {
        kind: "p",
        text: "Sleeper has a built-in draft order randomizer that the commissioner can trigger from the league dashboard. It's fast — one click — but only the commissioner sees it fire and the result is unverifiable. Here's the exact path, plus when to skip it.",
      },
      { kind: "h2", text: "The exact steps in the Sleeper app" },
      {
        kind: "ol",
        items: [
          "Open your Sleeper league in the web app or mobile app.",
          "Tap the gear icon (League Settings).",
          "Scroll to the Draft section.",
          "Open Draft Order.",
          "Tap Randomize Order. The order shuffles on screen.",
          "Tap Save. The order is now committed to the draft room.",
        ],
      },
      { kind: "h2", text: "What's the catch?" },
      {
        kind: "p",
        text: "Two catches. First, only the commissioner sees the randomize button fire — the rest of the league sees the final result with no way to verify how it was produced. Second, the commissioner can re-randomize as many times as they want before saving, so the result that gets saved is the result the commissioner liked best.",
      },
      {
        kind: "p",
        text: "For a casual league this is fine. For a league with money, keepers, or strong opinions, it's the kind of thing that quietly poisons trust over years.",
      },
      { kind: "h2", text: "The better way: public scheduled draw" },
      {
        kind: "p",
        text: "Schedule a Fantasy Draft Order draw, paste your Sleeper league ID to import your teams, and pick a draw time. Share one link. The whole league opens it; everyone sees the same animation at the same second; the result is permanent and the source code is open. After the draw, copy the order into Sleeper's draft order settings.",
      },
      {
        kind: "callout",
        tone: "info",
        text: "Total time vs Sleeper's button: about 60 seconds longer to set up, plus the actual draw window. Trade: nobody can dispute the result, ever.",
      },
    ],
    faqs: [
      {
        q: "Will Sleeper still let me edit the order after Fantasy Draft Order produces it?",
        a: "Yes — Sleeper's draft order settings remain editable up until the draft starts. You'd manually copy the order Fantasy Draft Order produced into Sleeper's settings.",
      },
      {
        q: "Does Fantasy Draft Order need my Sleeper credentials?",
        a: "No. We use Sleeper's public read-only API with just the league ID. No login, no OAuth, no permissions on your account.",
      },
    ],
  },
  {
    slug: "how-to-randomize-draft-order-on-espn",
    title: "How to randomize draft order on ESPN Fantasy",
    description:
      "ESPN auto-randomizes the draft order an hour before your draft starts. Here's how to set it manually, and how to make the result verifiable.",
    excerpt:
      "ESPN's draft order behavior is one of the more confusing parts of the platform. Here's exactly what happens and when.",
    datePublished: "2026-03-11",
    readingMinutes: 4,
    category: "Platform guides",
    keywords: [
      "how to randomize draft order on espn",
      "espn fantasy draft order",
      "espn randomize draft",
    ],
    sections: [
      {
        kind: "p",
        text: "ESPN's draft order works two ways: the commissioner sets it manually, or ESPN automatically randomizes it one hour before the draft starts. Here's exactly how each one happens.",
      },
      { kind: "h2", text: "Setting the order manually as commissioner" },
      {
        kind: "ol",
        items: [
          "Open the ESPN fantasy app or web app.",
          "Open League Settings.",
          "Open Draft Settings.",
          "Open Draft Order. You'll see a draggable list of teams.",
          "Click Randomize Order to shuffle, or drag teams into the order you want.",
          "Click Save.",
        ],
      },
      {
        kind: "p",
        text: "The Randomize Order button can be clicked an unlimited number of times before saving. The commissioner sees every result; the league sees only the final saved order.",
      },
      { kind: "h2", text: "What happens if you don't set it manually" },
      {
        kind: "p",
        text: "If the commissioner does not set a draft order, ESPN automatically randomizes the order one hour before the draft is scheduled to begin. This is convenient, but the league has no visibility into when the randomization happened or what it produced — the order just appears in the draft room when it opens.",
      },
      { kind: "h2", text: "How to make the order verifiable" },
      {
        kind: "p",
        text: "Schedule a Fantasy Draft Order draw before ESPN's auto-randomization deadline. Add your teams (manually for private leagues, or by ESPN league ID for public leagues). Share the draw link with your league. After the draw, copy the order into ESPN's draft order settings before ESPN's one-hour cutoff.",
      },
      {
        kind: "callout",
        tone: "info",
        text: "ESPN's one-hour cutoff means you should run your Fantasy Draft Order draw at least 90 minutes before your draft to leave time to copy the result into ESPN.",
      },
    ],
    faqs: [
      {
        q: "Can I import private ESPN leagues by league ID?",
        a: "Not yet. Private ESPN leagues require authentication that we don't do (since we don't do accounts). For private leagues, add your teams manually — it takes about 60 seconds.",
      },
      {
        q: "What if I miss ESPN's one-hour cutoff?",
        a: "ESPN will auto-randomize. The league will get whatever ESPN produces. The point of pre-running a Fantasy Draft Order draw is to control that moment yourself.",
      },
    ],
  },
  {
    slug: "how-to-randomize-draft-order-on-yahoo",
    title: "How to randomize draft order on Yahoo Fantasy",
    description:
      "Yahoo's draft order randomization is buried under a few menus. Here's the exact path — plus a way to make it auditable.",
    excerpt:
      "Yahoo doesn't have a public API, so it doesn't get integrations love. Here's the manual playbook.",
    datePublished: "2026-03-04",
    readingMinutes: 4,
    category: "Platform guides",
    keywords: [
      "how to randomize draft order on yahoo",
      "yahoo fantasy draft order",
      "yahoo randomize draft",
    ],
    sections: [
      {
        kind: "p",
        text: "Yahoo's randomize button is harder to find than Sleeper's or ESPN's, but it works the same way: the commissioner clicks it, the order shuffles, and only the commissioner sees the result before it's saved.",
      },
      { kind: "h2", text: "The exact steps" },
      {
        kind: "ol",
        items: [
          "Open your Yahoo fantasy league in a browser. Yahoo's mobile app has fewer commissioner controls — use the web.",
          "Hover League and click Settings.",
          "Click the Edit button next to Draft Type and Time.",
          "Find Draft Order. There's a Randomize Order button, plus a draggable list.",
          "Click Randomize Order, or set the order manually.",
          "Click Save Settings at the bottom.",
        ],
      },
      { kind: "h2", text: "What Yahoo doesn't show your league" },
      {
        kind: "p",
        text: "The randomize button can be re-rolled freely before saving. The league sees only the saved result. There's no audit trail.",
      },
      { kind: "h2", text: "Making it verifiable" },
      {
        kind: "p",
        text: "Yahoo doesn't expose a public league API, so Fantasy Draft Order uses manual entry for Yahoo leagues — type in the team names once. Schedule the draw, share the link, and the whole league watches the order come out of open-source code at the scheduled time. Copy the order into Yahoo's draft settings before your draft starts.",
      },
      {
        kind: "callout",
        tone: "info",
        text: "Yahoo's draft order can be edited up until the draft begins — not until an hour before like ESPN. You have more time to copy the order in.",
      },
    ],
    faqs: [
      {
        q: "Why doesn't Fantasy Draft Order import Yahoo leagues directly?",
        a: "Yahoo's API requires OAuth, which means accounts. Fantasy Draft Order doesn't do accounts on principle — it's how we keep the no-tracking promise honest.",
      },
      {
        q: "Will Yahoo support ever land?",
        a: "Possibly, if we can do read-only Yahoo without forcing accounts. Track GitHub for updates.",
      },
    ],
  },
  {
    slug: "commissioner-guide-running-a-fair-draft-order-reveal",
    title: "Commissioner's guide: running a fair fantasy draft order reveal",
    description:
      "Everything a commissioner needs to do to run a draft order reveal that nobody can dispute. Schedule, message, run, archive.",
    excerpt:
      "If you're the commissioner, the draft order reveal is the most political moment of your year. Here's the playbook.",
    datePublished: "2026-02-25",
    readingMinutes: 6,
    category: "Commissioner",
    keywords: [
      "commissioner guide draft order",
      "fantasy commissioner draft order",
      "running a fair draft order reveal",
    ],
    sections: [
      {
        kind: "p",
        text: "The commissioner's hardest moment of the year isn't trade vetoes or rule disputes — it's the draft order reveal. For five minutes, you have the power to give every team something they want or hate. The fix is to give that power away. Here's the playbook.",
      },
      { kind: "h2", text: "Step 1: Pick a date and time" },
      {
        kind: "p",
        text: "Pick a time that works for the whole league. The night the draft order is revealed should be a small event — group chat active, drinks if that's your league. The actual draw takes about 60 seconds; the build-up is the point.",
      },
      { kind: "h2", text: "Step 2: Schedule the draw at least 24 hours ahead" },
      {
        kind: "p",
        text: "Open Fantasy Draft Order, fill in your league name, your name, and the draw time. Add teams manually or by league ID. Schedule it. Copy the link. Don't share it yet.",
      },
      { kind: "h2", text: "Step 3: Send one message to the league chat" },
      {
        kind: "quote",
        text: "Draft order draw is set for [date] at [time]. Watch it live: [link]. Open source, scheduled, immutable — even I can't touch the result.",
        cite: "Suggested message",
      },
      {
        kind: "p",
        text: "The link works immediately — the league can verify the team list, the draw time, and the source code before the draw fires.",
      },
      { kind: "h2", text: "Step 4: At the scheduled time, do nothing" },
      {
        kind: "p",
        text: "Open the link yourself. Watch the picks reveal. Don't refresh, don't comment until the last pick is in. The draw fires server-side automatically.",
      },
      { kind: "h2", text: "Step 5: Archive the link" },
      {
        kind: "p",
        text: "Pin the draft URL in your league chat. The page works forever. If anyone questions the order in October, the link is the answer.",
      },
      { kind: "h2", text: "Step 6: Copy the order into your platform" },
      {
        kind: "p",
        text: "After the draw, copy the order into your fantasy platform's draft settings. Sleeper, ESPN, Yahoo, MFL, Fleaflicker — all of them let the commissioner enter the draft order manually.",
      },
      {
        kind: "callout",
        tone: "trust",
        text: "The whole point of this playbook is that no step requires anyone to trust you. The schedule is public. The randomizer is open source. The result is sealed and unalterable. You did the boring administrative work, and the result is verifiable forever.",
      },
    ],
    faqs: [
      {
        q: "What if a team disagrees with the result?",
        a: "There's nothing to disagree with. The seed, the source code, and the timestamps are all public. If they want to argue, they're arguing with math.",
      },
      {
        q: "Should I let teams have input on the draw method?",
        a: "Yes. Pick the method (uniform random, weighted, chaos) before the season starts and write it in the constitution. The point is to remove your discretion at draw time.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function listGuides(): Guide[] {
  return [...GUIDES].sort((a, b) =>
    b.datePublished.localeCompare(a.datePublished)
  );
}
