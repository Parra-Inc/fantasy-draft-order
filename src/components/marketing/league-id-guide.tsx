import Link from "next/link";
import { AlertTriangle, ArrowRight, Globe, Smartphone } from "lucide-react";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/cta";
import { LeagueIdForm } from "@/components/marketing/league-id-form";
import { BreadcrumbLd, FaqLd, HowToLd } from "@/lib/seo/jsonld";
import {
  LEAGUE_ID_GUIDES,
  type LeagueIdGuide,
} from "@/lib/seo/league-id-guides";

function UrlAnatomy({ guide }: { guide: LeagueIdGuide }) {
  const [before, after = ""] = guide.exampleUrl.split(guide.exampleId);
  return (
    <div className="border-sideline/60 bg-midnight/60 rounded-2xl border p-5 sm:p-6">
      <p className="text-hashmark font-mono text-xs tracking-wider uppercase">
        What it looks like
      </p>
      <p className="text-hashmark mt-3 overflow-x-auto font-mono text-sm sm:text-base">
        <span>{before}</span>
        <span className="bg-signal/20 text-signal rounded-md px-1.5 py-0.5 font-bold">
          {guide.exampleId}
        </span>
        <span>{after}</span>
      </p>
      <p className="text-chalk/80 mt-4 text-sm">
        Your league ID is the highlighted part:{" "}
        <span className="text-chalk font-semibold">{guide.idShape}</span>.
      </p>
      {guide.urlPatterns.length > 1 && (
        <ul className="border-sideline/50 mt-4 space-y-1.5 border-t pt-4">
          {guide.urlPatterns.map((pattern) => (
            <li key={pattern} className="text-hashmark/80 font-mono text-xs">
              {pattern}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Steps({
  icon: Icon,
  label,
  steps,
  offset,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  steps: string[];
  offset: number;
}) {
  return (
    <div className="border-sideline/50 bg-sideline/20 rounded-2xl border p-6">
      <div className="flex items-center gap-2.5">
        <div className="bg-signal/15 flex size-8 items-center justify-center rounded-lg">
          <Icon className="text-signal size-4" />
        </div>
        <h3 className="font-display text-chalk text-lg font-bold">{label}</h3>
      </div>
      <ol className="mt-5 space-y-3.5">
        {steps.map((step, i) => (
          <li
            key={step}
            id={`step-${offset + i + 1}`}
            className="text-chalk/85 flex scroll-mt-24 gap-3 text-sm leading-relaxed"
          >
            <span className="bg-sideline text-signal mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function LeagueIdGuideView({ guide }: { guide: LeagueIdGuide }) {
  const others = LEAGUE_ID_GUIDES.filter((g) => g.slug !== guide.slug);
  const path = `/league-id/${guide.slug}`;

  return (
    <main>
      <BreadcrumbLd
        items={[
          { name: "Home", path: "/" },
          { name: "League IDs", path: "/league-id" },
          { name: guide.platform, path },
        ]}
      />
      <HowToLd
        name={`How to find your ${guide.platform} league ID`}
        description={guide.description}
        path={path}
        steps={[...guide.webSteps, ...guide.appSteps]}
      />
      <FaqLd faqs={guide.faqs} />

      <section className="border-sideline/50 relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0">
          <div className="bg-signal/10 absolute top-0 left-1/2 h-[460px] w-[760px] -translate-x-1/2 rounded-full blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-16">
          <nav className="text-hashmark flex items-center gap-2 font-mono text-xs tracking-wider uppercase">
            <Link
              href="/league-id"
              className="hover:text-signal transition-colors"
            >
              League IDs
            </Link>
            <span>/</span>
            <span className="text-signal">{guide.short}</span>
          </nav>
          <h1 className="font-display text-chalk mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            {guide.h1} <span className="text-signal">{guide.h1Accent}</span>
          </h1>
          <p className="text-hashmark mt-6 max-w-2xl text-lg leading-relaxed">
            {guide.intro}
          </p>

          <div className="mt-10">
            <UrlAnatomy guide={guide} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          <Steps
            icon={Globe}
            label="On the web"
            steps={guide.webSteps}
            offset={0}
          />
          <Steps
            icon={Smartphone}
            label={guide.appLabel}
            steps={guide.appSteps}
            offset={guide.webSteps.length}
          />
        </div>

        <div className="mt-12">
          <h2 className="font-display text-chalk text-2xl font-bold sm:text-3xl">
            {guide.short} league ID finder.
          </h2>
          {guide.source ? (
            <>
              <p className="text-hashmark mt-3 max-w-2xl">
                Paste the ID you found. If it is the right one, your teams,
                owners, and avatars appear straight away, which is the fastest
                way to check you grabbed the correct number. No account, no
                OAuth, and nothing is written back to {guide.platform}.
              </p>
              <LeagueIdForm defaultSource={guide.source} showHelpLink={false} />
            </>
          ) : (
            <>
              <p className="text-hashmark mt-3 max-w-2xl">
                There is no {guide.platform} API to check an ID against, so your
                league settings page is the source of truth. Once you have the
                number, Fantasy Football Draft Order uses manual entry: paste
                your team names one per line on the create form, pick a draw
                time, and share one link. Everything after that is identical to
                an imported league.
              </p>
              <Link
                href="/new?tab=manual"
                className="bg-signal text-midnight shadow-signal/20 hover:bg-signal-dark mt-8 inline-flex h-12 items-center gap-2 rounded-xl px-7 font-semibold shadow-lg transition-colors"
              >
                Add teams manually
                <ArrowRight className="size-4" />
              </Link>
            </>
          )}
        </div>

        <div className="border-sideline/60 bg-sideline/20 mt-14 rounded-2xl border p-6 sm:p-7">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="text-signal size-4" />
            <h2 className="font-display text-chalk text-lg font-bold">
              Things that trip people up
            </h2>
          </div>
          <ul className="mt-5 space-y-3">
            {guide.gotchas.map((g) => (
              <li
                key={g}
                className="text-chalk/85 flex gap-3 text-sm leading-relaxed"
              >
                <span className="bg-signal/70 mt-2 size-1.5 shrink-0 rounded-full" />
                {g}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14">
          <h2 className="font-display text-chalk text-xl font-bold">
            People also search for
          </h2>
          <p className="text-hashmark mt-3 max-w-2xl text-sm leading-relaxed">
            This page answers all of these: they are the same {guide.short}{" "}
            league ID, found the same way.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {guide.searchTerms.map((term) => (
              <li
                key={term}
                className="border-sideline/60 bg-sideline/20 text-hashmark rounded-full border px-3 py-1.5 text-xs"
              >
                {term}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14">
          <h2 className="font-display text-chalk text-xl font-bold">
            Other platforms
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/league-id/${o.slug}`}
                className="group border-sideline/50 bg-sideline/20 hover:border-signal/40 hover:bg-sideline/30 flex items-center justify-between gap-3 rounded-xl border px-5 py-4 transition-colors"
              >
                <span>
                  <span className="font-display text-chalk group-hover:text-signal block font-semibold transition-colors">
                    {o.platform} league ID
                  </span>
                  <span className="text-hashmark mt-0.5 block text-xs">
                    {o.idShape}
                  </span>
                </span>
                <ArrowRight className="text-hashmark group-hover:text-signal size-4 shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
          <Link
            href={guide.platformPage}
            className="text-hashmark hover:text-chalk mt-5 inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            More on {guide.platform} draft order
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      <Faq
        faqs={guide.faqs}
        heading={`${guide.short} league ID questions.`}
        emitJsonLd={false}
      />
      <FinalCta />
    </main>
  );
}
