import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { BreadcrumbLd } from "@/lib/seo/jsonld";
import { listGuides } from "@/lib/seo/guides";

export const metadata = buildMetadata({
  title: "Fantasy Draft Order Guides — Trust, Tools, and Tradition",
  description:
    "Long-form guides on running fair fantasy drafts. Snake vs straight, weighted vs random lotteries, platform-by-platform randomizer walkthroughs, and creative ways to pick draft order.",
  path: "/guides",
  keywords: [
    "fantasy draft guides",
    "fantasy draft order how to",
    "fantasy commissioner guides",
  ],
});

export default function GuidesIndexPage() {
  const guides = listGuides();
  const categories = Array.from(new Set(guides.map((g) => g.category)));

  return (
    <main>
      <BreadcrumbLd
        items={[
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ]}
      />

      <section className="relative overflow-hidden border-b border-sideline/50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-signal/10 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28 sm:pb-16">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-signal">
            Guides
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-chalk sm:text-5xl">
            Everything we know about{" "}
            <span className="text-signal">fair fantasy drafts.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-hashmark">
            Long-form guides on snake versus straight, weighted lotteries,
            platform randomizer walkthroughs, and the rituals leagues actually
            use to pick draft order.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-4 sm:grid-cols-2">
          {guides.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="group flex flex-col rounded-2xl border border-sideline/50 bg-sideline/20 p-6 transition-colors hover:border-signal/40 hover:bg-sideline/30"
            >
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono uppercase tracking-wider text-signal">
                  {g.category}
                </span>
                <span className="text-hashmark">·</span>
                <span className="text-hashmark">
                  {g.readingMinutes} min read
                </span>
              </div>
              <h2 className="mt-3 font-display text-xl font-bold text-chalk transition-colors group-hover:text-signal">
                {g.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-hashmark">
                {g.excerpt}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-signal">
                Read guide <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-hashmark">
          {categories.length} categories · {guides.length} guides · No paywalls,
          no email gates.
        </div>
      </section>
    </main>
  );
}
