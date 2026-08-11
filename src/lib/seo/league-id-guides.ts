import type { ImportSource } from "@/lib/importers/types";

export type LeagueIdGuide = {
  slug: string;
  /** Full platform name, e.g. "MyFantasyLeague". */
  platform: string;
  /** Short label used in chips and nav, e.g. "MFL". */
  short: string;
  /** null means the platform has no public API and uses manual entry. */
  source: ImportSource | null;
  /** Existing platform landing page. */
  platformPage: string;
  /**
   * Slug in GUIDES for this platform's draft-order walkthrough, when one
   * exists. These league ID pages are the most-crawled part of the site, and
   * the walkthroughs are the least; this is the in-body link between them.
   */
  draftOrderGuide?: string;
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  h1Accent: string;
  intro: string;
  /** One-line shape of the ID, e.g. "18 digits, numbers only". */
  idShape: string;
  exampleUrl: string;
  exampleId: string;
  urlPatterns: string[];
  /** Query phrasings people actually type, rendered on-page as chips. */
  searchTerms: string[];
  webSteps: string[];
  appLabel: string;
  appSteps: string[];
  /** Compact version shown inline in the create-draft form. */
  quickHint: string;
  quickSteps: string[];
  gotchas: string[];
  faqs: { q: string; a: string }[];
  updated: string;
};

const UPDATED = "2026-07-25";

export const LEAGUE_ID_GUIDES: LeagueIdGuide[] = [
  {
    slug: "sleeper",
    platform: "Sleeper",
    short: "Sleeper",
    source: "SLEEPER",
    platformPage: "/sleeper",
    draftOrderGuide: "how-to-randomize-draft-order-on-sleeper",
    title: "Find Your Sleeper League ID: 18 Digits, Web or App (2026)",
    description:
      "Two ten-second paths: the 18-digit number after /leagues/ in your Sleeper URL, or Copy League ID in the app's General settings. Plus why last season's ID fails.",
    keywords: [
      "sleeper league id finder",
      "sleeper league id",
      "find sleeper league id",
      "where to find sleeper league id",
      "how to find my sleeper league id",
      "what is my sleeper league id",
      "sleeper league id lookup",
      "sleeper league id in app",
      "copy sleeper league id",
      "sleeper league id number",
      "how to get sleeper league id",
      "sleeper league id from url",
    ],
    h1: "Where to find your",
    h1Accent: "Sleeper league ID.",
    intro:
      "Sleeper gives every league an 18-digit ID. It is in the URL on the web and behind a Copy League ID button in the mobile app. Both take about ten seconds, and you only need the number itself: no login, no password, nothing about your account.",
    idShape: "18 digits, numbers only",
    exampleUrl: "https://sleeper.com/leagues/1049283494438133760/team",
    exampleId: "1049283494438133760",
    urlPatterns: [
      "sleeper.com/leagues/<league ID>/team",
      "sleeper.app/leagues/<league ID>",
    ],
    searchTerms: [
      "sleeper league id finder",
      "find my sleeper league id",
      "what is my sleeper league id",
      "sleeper league id lookup",
      "how to get league id sleeper",
      "sleeper league id in the app",
      "sleeper league id number",
    ],
    webSteps: [
      "Open sleeper.com in a browser and sign in.",
      "Pick your league from the league switcher in the top-left corner.",
      "Look at the address bar. The long number right after /leagues/ is your league ID.",
      "Copy the number only. Drop the /team or /matchup that follows it.",
    ],
    appLabel: "In the Sleeper mobile app",
    appSteps: [
      "Open the league in the Sleeper app.",
      "Tap the gear icon to open league settings.",
      "Open General.",
      "Scroll to the bottom and tap Copy League ID.",
      "Paste it straight into the league ID field.",
    ],
    quickHint: "18-digit number after /leagues/ in your Sleeper URL",
    quickSteps: [
      "Web: sleeper.com/leagues/1049283494438133760/team",
      "App: gear icon, General, scroll down, Copy League ID",
    ],
    gotchas: [
      "Sleeper issues a brand new league ID every season when your league rolls over. Use the ID for the season you are drafting, not one from an old bookmark.",
      "An invite link like sleeper.com/i/abc123 is a join code, not a league ID. It will not import.",
      "The 18-digit league ID is not your user ID. Your user ID lives on your profile and is a different number.",
    ],
    faqs: [
      {
        q: "What is my Sleeper league ID?",
        a: "It is the 18-digit number Sleeper assigns your league. On the web it sits in your league URL right after /leagues/. In the app it is behind the Copy League ID button at the bottom of General league settings.",
      },
      {
        q: "Do I need to log in or connect my Sleeper account?",
        a: "No. Sleeper publishes league data through a read-only public API, so the league ID alone is enough. There is no OAuth screen, no password, and we never see anything about your account.",
      },
      {
        q: "What does Fantasy Football Draft Order pull from Sleeper?",
        a: "Team names, owner display names, and avatars for every roster in the league. Nothing else, and nothing is written back to Sleeper.",
      },
      {
        q: "Does this work for Sleeper basketball leagues too?",
        a: "Yes. Sleeper's league API is the same across sports, so any Sleeper league with rosters imports the same way.",
      },
      {
        q: "The ID does not work. What went wrong?",
        a: "Nine times out of ten it is last season's ID, or an invite code pasted instead of the ID. Re-open the league in the app and use Copy League ID to get the current one.",
      },
    ],
    updated: UPDATED,
  },
  {
    slug: "espn",
    platform: "ESPN Fantasy",
    short: "ESPN",
    source: "ESPN",
    platformPage: "/espn",
    draftOrderGuide: "how-to-randomize-draft-order-on-espn",
    title: "ESPN League ID Finder: Where to Find Your League ID",
    description:
      "Your ESPN league ID is the number after leagueId= in your league URL, and it is listed under the League tab in the ESPN Fantasy app. Here is exactly where to look.",
    keywords: [
      "espn league id finder",
      "espn fantasy league id",
      "find espn league id",
      "where to find espn league id",
      "how to find espn fantasy football league id",
      "what is my espn league id",
      "espn league id lookup",
      "espn league id in app",
      "espn leagueid url",
      "espn fantasy football league id number",
      "how to get espn league id",
    ],
    h1: "Where to find your",
    h1Accent: "ESPN league ID.",
    intro:
      "ESPN puts the league ID directly in the URL as leagueId=, and lists it under the League tab in the mobile app. The one thing to know up front: automatic import works for public ESPN leagues. Private leagues still work here, you just type the team names in.",
    idShape: "6 to 8 digits, numbers only",
    exampleUrl: "https://fantasy.espn.com/football/league?leagueId=1234567",
    exampleId: "1234567",
    urlPatterns: [
      "fantasy.espn.com/football/league?leagueId=<league ID>",
      "fantasy.espn.com/football/team?leagueId=<league ID>&teamId=3",
    ],
    searchTerms: [
      "espn league id finder",
      "find my espn league id",
      "what is my espn fantasy league id",
      "espn league id lookup",
      "how to get league id espn",
      "espn league id in the app",
      "espn fantasy football league id number",
    ],
    webSteps: [
      "Open fantasy.espn.com and sign in.",
      "Open your league from the My Teams list.",
      "Find leagueId= in the address bar. The digits immediately after it are your league ID.",
      "Stop at the next & symbol. teamId, seasonId, and scoringPeriodId are separate values, not part of the ID.",
    ],
    appLabel: "In the ESPN Fantasy app",
    appSteps: [
      "Open the ESPN Fantasy app and select your league.",
      "Tap the League tab.",
      "The League ID is listed on that screen alongside the rest of your league info.",
      "If you would rather copy and paste it, open the same league at fantasy.espn.com in a mobile browser and read it out of the URL.",
    ],
    quickHint: "digits after leagueId= in your ESPN URL, public leagues only",
    quickSteps: [
      "Web: fantasy.espn.com/football/league?leagueId=1234567",
      "App: League tab, the League ID is listed there",
    ],
    gotchas: [
      "Automatic import covers public ESPN leagues. Private leagues need ESPN account credentials we deliberately never ask for, so use manual entry instead.",
      "A commissioner can make a league public in League Settings, under Basic Settings, by turning on the setting that makes the league viewable to the public.",
      "We read the current season's football league. Old seasons and ESPN's other fantasy sports will not import.",
      "Do not paste the whole query string. leagueId=1234567&seasonId=2026 is two values, and only the first one is the league ID.",
    ],
    faqs: [
      {
        q: "What is my ESPN league ID?",
        a: "It is the 6 to 8 digit number ESPN assigns your league. It appears after leagueId= in your league URL, and it is listed under the League tab in the ESPN Fantasy app.",
      },
      {
        q: "Why does my ESPN league fail to import?",
        a: "Almost always because the league is private. ESPN blocks anonymous reads on private leagues and returns a 401, which we surface as a private-league message. Either make the league public in league settings or add the teams manually.",
      },
      {
        q: "How do I make my ESPN league public?",
        a: "Only the commissioner can do it: League Settings, then Basic Settings, then turn on the option that makes the league viewable to the public. Save, then retry the import.",
      },
      {
        q: "Does Fantasy Football Draft Order need my ESPN login or the espn_s2 cookie?",
        a: "No. Some tools ask you to paste your espn_s2 and SWID cookies so they can read private leagues. That is your session, and handing it to a website is a bad habit. We only ever read public league data.",
      },
      {
        q: "Can I still use this if my league is private?",
        a: "Yes. Switch to manual entry on the create form and type in the team names, one per line. The draw, the reveal, and the audit trail are identical.",
      },
    ],
    updated: UPDATED,
  },
  {
    slug: "yahoo",
    platform: "Yahoo Fantasy",
    short: "Yahoo",
    source: null,
    platformPage: "/yahoo",
    draftOrderGuide: "how-to-randomize-draft-order-on-yahoo",
    title: "Yahoo League ID Finder: Where to Find Your League ID",
    description:
      "Your Yahoo league ID is the number after /f1/ in your league URL, and the first row of your league settings page. Here is where to find it and what to do with it.",
    keywords: [
      "yahoo league id finder",
      "yahoo fantasy league id",
      "find yahoo league id",
      "where to find yahoo league id",
      "how to find my yahoo fantasy football league id",
      "what is my yahoo league id",
      "yahoo league id lookup",
      "yahoo fantasy league id number",
      "yahoo league id url",
      "how to get yahoo league id",
    ],
    h1: "Where to find your",
    h1Accent: "Yahoo league ID.",
    intro:
      "Yahoo shows your league ID in two places: the number after /f1/ in your league URL, and the very first row of your league settings. Worth knowing before you go hunting: Yahoo has no public league API, so Fantasy Football Draft Order does not import Yahoo leagues automatically. Grabbing the ID is still useful for every other tool that asks for it.",
    idShape: "6 or 7 digits, numbers only",
    exampleUrl: "https://football.fantasysports.yahoo.com/f1/123456",
    exampleId: "123456",
    urlPatterns: [
      "football.fantasysports.yahoo.com/f1/<league ID>",
      "basketball.fantasysports.yahoo.com/nba/<league ID>",
      "baseball.fantasysports.yahoo.com/b1/<league ID>",
    ],
    searchTerms: [
      "yahoo league id finder",
      "find my yahoo league id",
      "what is my yahoo fantasy league id",
      "yahoo league id lookup",
      "how to get league id yahoo",
      "yahoo fantasy football league id number",
    ],
    webSteps: [
      "Open your league at fantasysports.yahoo.com and sign in.",
      "Read the address bar. The number after /f1/ is your league ID.",
      "If your league uses a custom URL instead of a number, hover League and click Settings.",
      "League ID is the first row of the settings table.",
    ],
    appLabel: "In the Yahoo Fantasy app",
    appSteps: [
      "Open the Yahoo Fantasy app and select your league.",
      "Open the League tab, then Settings.",
      "League ID is listed at the top of the settings list.",
      "App versions move this around. If you cannot find it, open the league in a mobile browser: the number after /f1/ is the ID.",
    ],
    quickHint: "number after /f1/ in your Yahoo URL, manual entry only",
    quickSteps: [
      "Web: football.fantasysports.yahoo.com/f1/123456",
      "Or: League, Settings, first row",
    ],
    gotchas: [
      "Yahoo reuses league ID numbers across sports and seasons. The same six digits can be a football league in one year and a basketball league in another, so always take the ID off this season's league page.",
      "If your commissioner set a custom league URL, the numeric ID is not in the address bar at all. Use League, then Settings.",
      "Fantasy Football Draft Order does not import Yahoo leagues. Yahoo's API requires OAuth, which requires accounts, and we do not do accounts. Type your team names in on the create form instead.",
    ],
    faqs: [
      {
        q: "What is my Yahoo league ID?",
        a: "It is the 6 or 7 digit number in your league URL right after /f1/, and it is the first row of your league settings page.",
      },
      {
        q: "Why can't Fantasy Football Draft Order import my Yahoo league?",
        a: "Yahoo has no public read-only league API. The only way in is OAuth, which means sign-in, accounts, and stored tokens. Not doing accounts is what keeps the no-tracking promise honest, so Yahoo leagues use manual entry.",
      },
      {
        q: "How long does manual entry take for a Yahoo league?",
        a: "About a minute. Paste your team names one per line on the create form. Everything after that is identical: scheduled draw, synchronized live reveal, permanent auditable result.",
      },
      {
        q: "Will Yahoo import ever be supported?",
        a: "Possibly, if it can be done read-only without forcing anyone to sign in. Track the GitHub repo for updates.",
      },
      {
        q: "Where do I put the order once the draw is done?",
        a: "Yahoo lets the commissioner edit draft order right up until the draft begins. Open your league settings, edit Draft Type and Time, and enter the order from your Fantasy Football Draft Order results page.",
      },
    ],
    updated: UPDATED,
  },
  {
    slug: "mfl",
    platform: "MyFantasyLeague",
    short: "MFL",
    source: "MFL",
    platformPage: "/mfl",
    title: "MFL League ID Finder: Where to Find Your MyFantasyLeague ID",
    description:
      "Your MFL league ID is the 5-digit number at the end of your league home URL, right after the season year. Here is how to read it correctly and what to leave out.",
    keywords: [
      "mfl league id finder",
      "myfantasyleague league id finder",
      "myfantasyleague league id",
      "mfl league id",
      "find mfl league id",
      "where to find mfl league id",
      "how to find my myfantasyleague league id",
      "what is my mfl league id",
      "mfl league id lookup",
      "mfl league id number",
    ],
    h1: "Where to find your",
    h1Accent: "MyFantasyLeague ID.",
    intro:
      "MFL puts your league ID at the end of every league URL, right after the season year. The trap is that an MFL URL has three numbers in it and only one of them is the league ID. Here is how to pick the right one.",
    idShape: "5 digits, numbers only",
    exampleUrl: "https://www46.myfantasyleague.com/2026/home/12345",
    exampleId: "12345",
    urlPatterns: [
      "wwwNN.myfantasyleague.com/<year>/home/<league ID>",
      "wwwNN.myfantasyleague.com/<year>/options?L=<league ID>",
    ],
    searchTerms: [
      "mfl league id finder",
      "myfantasyleague league id finder",
      "find my mfl league id",
      "what is my myfantasyleague league id",
      "mfl league id lookup",
      "myfantasyleague league id number",
    ],
    webSteps: [
      "Open your league home page on MyFantasyLeague.",
      "Read the address bar. The last group of digits, right after /home/, is your league ID.",
      "Ignore the year before it and the server number in www46. Neither is part of the ID.",
      "Any MFL page with ?L=12345 in the query string shows the same ID if you would rather grab it there.",
    ],
    appLabel: "On a phone",
    appSteps: [
      "MFL has no official mobile app. The mobile site is the same site.",
      "Open your league home page in your phone's browser.",
      "Tap the address bar to expand the full URL.",
      "Copy the digits after /home/.",
    ],
    quickHint: "5 digits after /home/ in your MFL URL",
    quickSteps: [
      "Web: www46.myfantasyleague.com/2026/home/12345",
      "Or: any MFL page with ?L=12345",
    ],
    gotchas: [
      "The four-digit number in the URL is the season, not the league. In /2026/home/12345 the league ID is 12345.",
      "The www46 part is just which MFL server hosts your league. It changes over time and is never part of the ID.",
      "We read the current season's league data. If your league has not been rolled over for this season yet, the import will come up empty.",
      "If your commissioner has restricted league data in MFL's settings, the import can fail even with a correct ID. Manual entry always works.",
    ],
    faqs: [
      {
        q: "What is my MyFantasyLeague league ID?",
        a: "It is the 5-digit number at the end of your league home URL, right after the season year. In wwwNN.myfantasyleague.com/2026/home/12345 the league ID is 12345.",
      },
      {
        q: "Do I need MFL credentials or an API key?",
        a: "No. Fantasy Football Draft Order reads franchise names, owner names, and icons through MFL's public export API using only the league ID.",
      },
      {
        q: "My league URL has a different year in it. Which do I use?",
        a: "Use the league ID digits regardless of the year in the URL. We always query the current season, so as long as the league exists this season it will import.",
      },
      {
        q: "Why does the server number in the URL keep changing?",
        a: "MFL spreads leagues across numbered servers and moves them between seasons. That is why the ID, not the URL, is the thing to save.",
      },
    ],
    updated: UPDATED,
  },
  {
    slug: "fleaflicker",
    platform: "Fleaflicker",
    short: "Fleaflicker",
    source: "FLEAFLICKER",
    platformPage: "/fleaflicker",
    title: "Fleaflicker League ID Finder: Where to Find Your League ID",
    description:
      "Your Fleaflicker league ID is the number at the end of your league URL, after /leagues/. Here is how to read it and the parts of the URL to ignore.",
    keywords: [
      "fleaflicker league id finder",
      "fleaflicker league id",
      "find fleaflicker league id",
      "where to find fleaflicker league id",
      "how to find my fleaflicker league id",
      "what is my fleaflicker league id",
      "fleaflicker league id lookup",
      "fleaflicker league id number",
      "fleaflicker league url",
    ],
    h1: "Where to find your",
    h1Accent: "Fleaflicker league ID.",
    intro:
      "Fleaflicker is the easiest of the bunch. The league ID is the number at the end of your league URL, and Fleaflicker is web-only, so the path is identical on a phone and a laptop.",
    idShape: "6 digits, numbers only",
    exampleUrl: "https://www.fleaflicker.com/nfl/leagues/312861",
    exampleId: "312861",
    urlPatterns: [
      "fleaflicker.com/nfl/leagues/<league ID>",
      "fleaflicker.com/mlb/leagues/<league ID>",
      "fleaflicker.com/nba/leagues/<league ID>",
    ],
    searchTerms: [
      "fleaflicker league id finder",
      "find my fleaflicker league id",
      "what is my fleaflicker league id",
      "fleaflicker league id lookup",
      "fleaflicker league id number",
    ],
    webSteps: [
      "Open your league on fleaflicker.com.",
      "Read the address bar. The number right after /leagues/ is your league ID.",
      "Drop anything after it. URLs like /leagues/312861/teams/9876 still contain the same league ID at the front.",
      "The sport in the path, nfl or mlb or nba, is not part of the ID.",
    ],
    appLabel: "On a phone",
    appSteps: [
      "Fleaflicker has no native app. The mobile site is the same site.",
      "Open your league in your phone's browser.",
      "Tap the address bar to expand the full URL.",
      "Copy the digits after /leagues/.",
    ],
    quickHint: "number after /leagues/ in your Fleaflicker URL",
    quickSteps: [
      "Web: fleaflicker.com/nfl/leagues/312861",
      "Same URL on desktop and mobile",
    ],
    gotchas: [
      "Ignore the sport segment. nfl, mlb, nba, and nhl leagues all use the same numeric ID format.",
      "If you are looking at a team page, the trailing number is a team ID. The league ID is the one immediately after /leagues/.",
    ],
    faqs: [
      {
        q: "What is my Fleaflicker league ID?",
        a: "It is the 6-digit number right after /leagues/ in your league URL. In fleaflicker.com/nfl/leagues/312861 the league ID is 312861.",
      },
      {
        q: "Does the sport matter for importing?",
        a: "No. Fleaflicker's standings endpoint takes a league ID on its own, so football, baseball, basketball, and hockey leagues all import the same way.",
      },
      {
        q: "Do I need to be logged into Fleaflicker?",
        a: "No. We read public league standings with the league ID alone. No credentials, no OAuth.",
      },
      {
        q: "What gets imported?",
        a: "Team names, the first listed owner for each team, and team logos, across every division in the league.",
      },
    ],
    updated: UPDATED,
  },
];

export function getLeagueIdGuide(slug: string): LeagueIdGuide | undefined {
  return LEAGUE_ID_GUIDES.find((g) => g.slug === slug);
}

export function getLeagueIdGuideBySource(
  source: ImportSource,
): LeagueIdGuide | undefined {
  return LEAGUE_ID_GUIDES.find((g) => g.source === source);
}
