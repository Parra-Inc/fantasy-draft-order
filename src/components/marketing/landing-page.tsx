import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GithubIcon } from "@/components/icons/github";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { WhyFair } from "@/components/marketing/why-fair";
import { Integrations } from "@/components/marketing/integrations";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";
import { BreadcrumbLd } from "@/lib/seo/jsonld";
import type { LandingPage } from "@/lib/seo/landing-pages";
import { getGuide } from "@/lib/seo/guides";

const GITHUB_URL = "https://github.com/Parra-Inc/fantasy-draft-order";

/**
 * In-body links from a landing page into the guides that continue its topic.
 *
 * Sits above the FAQ rather than under the footer on purpose: the guides were
 * reachable only from the footer, /guides and the sitemap, and the platform
 * walkthroughs stayed unindexed as a result. These pages are the crawled
 * surface, so this is the shortest path from a crawler to a guide.
 */
function ReadNext({ page }: { page: LandingPage }) {
  const guides = (page.relatedGuides ?? [])
    .map((slug) => getGuide(slug))
    .filter((g) => g !== undefined);
  if (guides.length === 0) return null;

  return (
    <section className="border-sideline/50 border-t">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
            Read next
          </p>
          <h2 className="font-display text-chalk mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {page.eyebrow} draft order, in more depth.
          </h2>
        </div>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guides/${g.slug}`}
                className="group border-sideline/50 bg-sideline/20 hover:border-signal/40 hover:bg-sideline/30 flex h-full flex-col rounded-2xl border p-5 transition-colors"
              >
                <span className="text-signal font-mono text-[11px] tracking-wider uppercase">
                  {g.category}
                </span>
                <span className="font-display text-chalk group-hover:text-signal mt-2 block text-base font-bold transition-colors">
                  {g.title}
                </span>
                <span className="text-hashmark mt-2 block flex-1 text-sm leading-relaxed">
                  {g.excerpt}
                </span>
                <span className="text-signal mt-3 inline-flex items-center gap-1.5 text-xs font-semibold">
                  Read guide <ArrowRight className="size-3" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function LandingPageView({ page }: { page: LandingPage }) {
  return (
    <main>
      <BreadcrumbLd
        items={[
          { name: "Home", path: "/" },
          { name: page.breadcrumbName, path: `/${page.slug}` },
        ]}
      />

      <section className="border-sideline/50 relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0">
          <div className="bg-signal/10 absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28 sm:pb-20">
          <p className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
            {page.eyebrow}
          </p>
          <h1 className="font-display text-chalk mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {page.h1}
            {page.h1Accent ? (
              <>
                {" "}
                <span className="text-signal">{page.h1Accent}</span>
              </>
            ) : null}
          </h1>
          <p className="text-hashmark mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
            {page.intro}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/new"
              className="bg-signal text-midnight shadow-signal/20 hover:bg-signal-dark inline-flex h-12 items-center gap-2 rounded-xl px-7 font-semibold shadow-lg transition-colors"
            >
              Schedule the draw
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="border-sideline text-chalk hover:bg-sideline/50 inline-flex h-12 items-center gap-2 rounded-xl border px-6 font-semibold transition-colors"
            >
              <GithubIcon className="size-4" />
              View on GitHub
            </a>
          </div>
          <p className="text-hashmark/70 mt-6 text-xs">
            Free to use. Under a minute to set up. No credit card ever.
          </p>
          {page.leagueIdSlug ? (
            <Link
              href={`/league-id/${page.leagueIdSlug}`}
              className="text-hashmark hover:text-signal mt-5 inline-flex items-center gap-1.5 text-sm underline-offset-4 transition-colors hover:underline"
            >
              Where to find your {page.eyebrow} league ID
              <ArrowRight className="size-3.5" />
            </Link>
          ) : null}
        </div>
      </section>

      <HowItWorks />
      <WhyFair />
      <Integrations highlight={page.highlightPlatform} />
      <ReadNext page={page} />
      <Faq
        faqs={page.faqs}
        heading={`${page.eyebrow} — questions leagues ask.`}
      />
      <FinalCta />
    </main>
  );
}
