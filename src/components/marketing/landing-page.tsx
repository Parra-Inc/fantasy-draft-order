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

const GITHUB_URL = "https://github.com/fantasy-draft-order/fantasy-draft-order";

export function LandingPageView({ page }: { page: LandingPage }) {
  return (
    <main>
      <BreadcrumbLd
        items={[
          { name: "Home", path: "/" },
          { name: page.breadcrumbName, path: `/${page.slug}` },
        ]}
      />

      <section className="relative overflow-hidden border-b border-sideline/50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-signal/10 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28 sm:pb-20">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-signal">
            {page.eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-chalk sm:text-5xl lg:text-6xl">
            {page.h1}
            {page.h1Accent ? (
              <>
                {" "}
                <span className="text-signal">{page.h1Accent}</span>
              </>
            ) : null}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-hashmark">
            {page.intro}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/new"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-signal px-7 font-semibold text-midnight shadow-lg shadow-signal/20 transition-colors hover:bg-signal-dark"
            >
              Create a draft
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-sideline px-6 font-semibold text-chalk transition-colors hover:bg-sideline/50"
            >
              <GithubIcon className="size-4" />
              View on GitHub
            </a>
          </div>
          <p className="mt-6 text-xs text-hashmark/70">
            Free to use. Under a minute to set up. No credit card ever.
          </p>
        </div>
      </section>

      <HowItWorks />
      <WhyFair />
      <Integrations highlight={page.highlightPlatform} />
      <Faq faqs={page.faqs} heading={`${page.eyebrow} — questions leagues ask.`} />
      <FinalCta />
    </main>
  );
}
