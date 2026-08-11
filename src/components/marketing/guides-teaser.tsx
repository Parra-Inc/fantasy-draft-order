import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listGuides } from "@/lib/seo/guides";

/**
 * Every guide, linked from the homepage.
 *
 * Not a "latest three" teaser on purpose. The guides were previously reachable
 * only through the footer, the /guides index and the sitemap, and the ones with
 * no external links (the platform walkthroughs) sat live and correctly defined
 * but unindexed. A crawler that lands on the homepage should be one click from
 * all of them, and a reader who came for a Sleeper or ESPN answer should see
 * that the answer exists without going through an index page first.
 */
export function GuidesTeaser() {
  const guides = listGuides();

  return (
    <section className="border-sideline/50 border-t">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
            Guides
          </p>
          <h2 className="font-display text-chalk mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            How your platform does it.
          </h2>
          <p className="text-hashmark mt-4 leading-relaxed">
            Step-by-step walkthroughs for randomizing draft order on{" "}
            <Link
              href="/guides/how-to-randomize-draft-order-on-sleeper"
              className="text-signal decoration-signal/40 hover:decoration-signal font-medium underline underline-offset-4"
            >
              Sleeper
            </Link>
            ,{" "}
            <Link
              href="/guides/how-to-randomize-draft-order-on-espn"
              className="text-signal decoration-signal/40 hover:decoration-signal font-medium underline underline-offset-4"
            >
              ESPN
            </Link>{" "}
            and{" "}
            <Link
              href="/guides/how-to-randomize-draft-order-on-yahoo"
              className="text-signal decoration-signal/40 hover:decoration-signal font-medium underline underline-offset-4"
            >
              Yahoo
            </Link>
            , plus the arguments behind snake versus straight, weighted
            lotteries and the rituals leagues actually use.
          </p>
        </div>

        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                <span className="text-hashmark mt-3 block text-xs">
                  {g.readingMinutes} min read
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link
            href="/guides"
            className="text-signal inline-flex items-center gap-1.5 text-sm font-semibold"
          >
            All {guides.length} guides <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
