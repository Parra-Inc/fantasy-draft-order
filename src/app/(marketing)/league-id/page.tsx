import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";
import { BreadcrumbLd } from "@/lib/seo/jsonld";
import { LEAGUE_ID_GUIDES } from "@/lib/seo/league-id-guides";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Fantasy League ID Finder: Find Your League ID on Any Platform",
  description:
    "League ID finder for Sleeper, ESPN, Yahoo, MyFantasyLeague, and Fleaflicker. Exact steps for the web and the mobile app, what the ID looks like, and the parts of the URL to leave out.",
  path: "/league-id",
  keywords: [
    "league id finder",
    "fantasy league id finder",
    "find my fantasy league id",
    "what is my league id",
    "where is my league id",
    "fantasy league id lookup",
    "sleeper league id finder",
    "espn league id finder",
    "yahoo league id finder",
    "mfl league id finder",
    "fleaflicker league id finder",
  ],
});

const HUB_FAQS = [
  {
    q: "Why does Fantasy Football Draft Order need my league ID?",
    a: "It is the only thing needed to read your league's public team list. We use it to pull team names, owner names, and avatars so you do not have to type twelve teams by hand. No password, no OAuth, no account.",
  },
  {
    q: "Is my league ID private?",
    a: "No. A league ID is a public identifier, the same way a URL is. It does not grant access to your account, cannot be used to join or edit your league, and is visible to anyone your commissioner shares the league link with.",
  },
  {
    q: "What if I cannot find my league ID?",
    a: "Skip it. Every platform works with manual entry: type your team names one per line on the create form. The draw, the live reveal, and the permanent audit trail are exactly the same.",
  },
  {
    q: "Which platforms import automatically?",
    a: "Sleeper, MyFantasyLeague, Fleaflicker, and public ESPN leagues. Yahoo has no public league API, so Yahoo leagues use manual entry.",
  },
];

export default function LeagueIdHubPage() {
  return (
    <main>
      <BreadcrumbLd
        items={[
          { name: "Home", path: "/" },
          { name: "League IDs", path: "/league-id" },
        ]}
      />

      <section className="border-sideline/50 relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0">
          <div className="bg-signal/10 absolute top-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28 sm:pb-16">
          <p className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
            League ID finder
          </p>
          <h1 className="font-display text-chalk mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Where to find your{" "}
            <span className="text-signal">fantasy league ID.</span>
          </h1>
          <p className="text-hashmark mx-auto mt-5 max-w-xl text-lg leading-relaxed">
            Every platform hides it somewhere slightly different. Pick yours for
            the exact path on the web and in the app, what the ID looks like,
            and the parts of the URL to leave out.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-4 sm:grid-cols-2">
          {LEAGUE_ID_GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/league-id/${g.slug}`}
              className="group border-sideline/50 bg-sideline/20 hover:border-signal/40 hover:bg-sideline/30 flex flex-col rounded-2xl border p-6 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-chalk group-hover:text-signal text-lg font-bold transition-colors">
                  {g.platform}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase ${
                    g.source
                      ? "bg-signal/15 text-signal"
                      : "bg-sideline text-hashmark"
                  }`}
                >
                  {g.source ? "Auto import" : "Manual entry"}
                </span>
              </div>
              <p className="text-hashmark mt-3 font-mono text-xs">
                {g.idShape}
              </p>
              <p className="text-chalk/80 mt-3 flex-1 text-sm leading-relaxed">
                {g.quickHint.charAt(0).toUpperCase() + g.quickHint.slice(1)}.
              </p>
              <span className="text-signal mt-5 inline-flex items-center gap-1.5 text-sm font-semibold">
                How to find it
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="border-sideline/60 bg-sideline/20 mt-10 rounded-2xl border p-6 text-center sm:p-7">
          <p className="font-display text-chalk text-lg font-bold">
            Cannot find it? You do not need it.
          </p>
          <p className="text-hashmark mx-auto mt-2 max-w-xl text-sm leading-relaxed">
            Manual entry takes about a minute: paste your team names one per
            line. The draft order generator, the synchronized live reveal on the
            spinner, and the permanent audit trail are identical either way.
          </p>
          <Link
            href="/new"
            className="border-sideline text-chalk hover:bg-sideline/50 mt-5 inline-flex h-11 items-center gap-2 rounded-xl border px-6 font-semibold transition-colors"
          >
            Add teams manually
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 sm:pb-20">
        <h2 className="font-display text-chalk text-xl font-bold">
          People also search for
        </h2>
        <p className="text-hashmark mt-3 max-w-2xl text-sm leading-relaxed">
          League ID finder, league ID lookup, or just &ldquo;what is my league
          ID&rdquo;: same number, same steps. Pick your platform.
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {LEAGUE_ID_GUIDES.flatMap((g) =>
            g.searchTerms.slice(0, 3).map((term) => (
              <li key={`${g.slug}-${term}`}>
                <Link
                  href={`/league-id/${g.slug}`}
                  className="border-sideline/60 bg-sideline/20 text-hashmark hover:border-signal/40 hover:text-chalk inline-block rounded-full border px-3 py-1.5 text-xs transition-colors"
                >
                  {term}
                </Link>
              </li>
            )),
          )}
        </ul>
      </section>

      <Faq faqs={HUB_FAQS} heading="League ID questions leagues ask." />
      <FinalCta />
    </main>
  );
}
