import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { buildMetadata } from "@/lib/seo/metadata";
import { ArticleLd, BreadcrumbLd, FaqLd } from "@/lib/seo/jsonld";
import { GUIDES, getGuide, listGuides } from "@/lib/seo/guides";
import { GuideRenderer } from "@/components/marketing/guide-renderer";
import { Faq } from "@/components/marketing/faq";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) {
    return buildMetadata({
      title: "Guide not found",
      description: "This guide does not exist.",
      path: `/guides/${slug}`,
      noindex: true,
    });
  }
  return buildMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${slug}`,
    keywords: guide.keywords,
    type: "article",
  });
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const all = listGuides();
  const idx = all.findIndex((g) => g.slug === guide.slug);
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  const prev = idx > 0 ? all[idx - 1] : null;

  return (
    <main>
      <BreadcrumbLd
        items={[
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ]}
      />
      <ArticleLd
        title={guide.title}
        description={guide.description}
        path={`/guides/${guide.slug}`}
        datePublished={guide.datePublished}
        dateModified={guide.dateModified}
      />
      <FaqLd faqs={guide.faqs} />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/guides"
          className="inline-flex items-center gap-1.5 text-sm text-hashmark transition-colors hover:text-chalk"
        >
          <ArrowLeft className="size-3.5" />
          All guides
        </Link>

        <div className="mt-6 flex items-center gap-3 text-xs">
          <span className="font-mono uppercase tracking-wider text-signal">
            {guide.category}
          </span>
          <span className="text-hashmark">·</span>
          <span className="text-hashmark">{guide.readingMinutes} min read</span>
          <span className="text-hashmark">·</span>
          <time className="text-hashmark" dateTime={guide.datePublished}>
            {new Date(guide.datePublished).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>

        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-chalk sm:text-5xl">
          {guide.title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-hashmark">
          {guide.excerpt}
        </p>

        <div className="mt-10">
          <GuideRenderer sections={guide.sections} />
        </div>

        <div className="mt-16 rounded-2xl border border-signal/30 bg-signal/5 p-6 text-center">
          <p className="font-display text-xl font-bold text-chalk">
            Ready to schedule a fair draft order?
          </p>
          <p className="mt-2 text-sm text-hashmark">
            Free, open source, no accounts. Under a minute to set up.
          </p>
          <Link
            href="/new"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-signal px-6 font-semibold text-midnight transition-colors hover:bg-signal-dark"
          >
            Create a draft <ArrowRight className="size-4" />
          </Link>
        </div>

        {(prev || next) && (
          <nav className="mt-12 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/guides/${prev.slug}`}
                className="group flex flex-col rounded-2xl border border-sideline/50 bg-sideline/20 p-5 transition-colors hover:border-signal/40"
              >
                <span className="text-xs text-hashmark">← Newer</span>
                <span className="mt-1 font-display font-semibold text-chalk transition-colors group-hover:text-signal">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/guides/${next.slug}`}
                className="group flex flex-col rounded-2xl border border-sideline/50 bg-sideline/20 p-5 text-right transition-colors hover:border-signal/40"
              >
                <span className="text-xs text-hashmark">Older →</span>
                <span className="mt-1 font-display font-semibold text-chalk transition-colors group-hover:text-signal">
                  {next.title}
                </span>
              </Link>
            ) : null}
          </nav>
        )}
      </article>

      <Faq
        faqs={guide.faqs}
        heading="Related questions"
        emitJsonLd={false}
      />
    </main>
  );
}
