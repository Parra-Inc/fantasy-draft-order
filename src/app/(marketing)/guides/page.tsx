import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { BreadcrumbLd } from "@/lib/seo/jsonld";
import { listGuides } from "@/lib/seo/guides";

export const metadata = buildMetadata({
  title: "Fantasy Football Draft Order Guides: Trust and Tradition",
  description:
    "Long-form guides on running fair fantasy football drafts. Snake vs straight, weighted vs random lotteries, platform-by-platform randomizer walkthroughs, and creative ways to pick draft order.",
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

      <section className="border-sideline/50 relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0">
          <div className="bg-signal/10 absolute top-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28 sm:pb-16">
          <p className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
            Guides
          </p>
          <h1 className="font-display text-chalk mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Everything we know about{" "}
            <span className="text-signal">fair fantasy football drafts.</span>
          </h1>
          <p className="text-hashmark mx-auto mt-5 max-w-xl text-lg leading-relaxed">
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
              className="group border-sideline/50 bg-sideline/20 hover:border-signal/40 hover:bg-sideline/30 flex flex-col rounded-2xl border p-6 transition-colors"
            >
              <div className="flex items-center gap-3 text-xs">
                <span className="text-signal font-mono tracking-wider uppercase">
                  {g.category}
                </span>
                <span className="text-hashmark">·</span>
                <span className="text-hashmark">
                  {g.readingMinutes} min read
                </span>
              </div>
              <h2 className="font-display text-chalk group-hover:text-signal mt-3 text-xl font-bold transition-colors">
                {g.title}
              </h2>
              <p className="text-hashmark mt-2 flex-1 text-sm leading-relaxed">
                {g.excerpt}
              </p>
              <span className="text-signal mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                Read guide <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-hashmark mx-auto max-w-xl text-sm leading-relaxed">
            Done reading? The{" "}
            <Link
              href="/new"
              className="text-signal decoration-signal/40 hover:decoration-signal font-medium underline underline-offset-4"
            >
              draft order generator
            </Link>{" "}
            runs the randomizer live on a spinner your whole league watches, and
            works as a draft lottery for keeper and dynasty leagues too.
          </p>
          <p className="text-hashmark mt-4 text-xs">
            {categories.length} categories · {guides.length} guides · No
            paywalls, no email gates.
          </p>
        </div>
      </section>
    </main>
  );
}
