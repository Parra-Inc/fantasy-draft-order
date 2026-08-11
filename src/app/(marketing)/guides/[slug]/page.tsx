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
    // metaTitle when the SERP wants something more specific than the H1.
    title: guide.metaTitle ?? guide.title,
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
          className="text-hashmark hover:text-chalk inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          All guides
        </Link>

        <div className="mt-6 flex items-center gap-3 text-xs">
          <span className="text-signal font-mono tracking-wider uppercase">
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

        <h1 className="font-display text-chalk mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {guide.title}
        </h1>
        <p className="text-hashmark mt-5 text-lg leading-relaxed">
          {guide.excerpt}
        </p>

        <div className="mt-10">
          <GuideRenderer sections={guide.sections} />
        </div>

        <div className="border-signal/30 bg-signal/5 mt-16 rounded-2xl border p-6 text-center">
          <p className="font-display text-chalk text-xl font-bold">
            Ready to schedule a fair draft order?
          </p>
          <p className="text-hashmark mt-2 text-sm">
            Free, open source, no accounts. Under a minute to set up.
          </p>
          <Link
            href="/new"
            className="bg-signal text-midnight hover:bg-signal-dark mt-5 inline-flex h-11 items-center gap-2 rounded-xl px-6 font-semibold transition-colors"
          >
            Schedule the draw <ArrowRight className="size-4" />
          </Link>
        </div>

        {(prev || next) && (
          <nav className="mt-12 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/guides/${prev.slug}`}
                className="group border-sideline/50 bg-sideline/20 hover:border-signal/40 flex flex-col rounded-2xl border p-5 transition-colors"
              >
                <span className="text-hashmark text-xs">← Newer</span>
                <span className="font-display text-chalk group-hover:text-signal mt-1 font-semibold transition-colors">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/guides/${next.slug}`}
                className="group border-sideline/50 bg-sideline/20 hover:border-signal/40 flex flex-col rounded-2xl border p-5 text-right transition-colors"
              >
                <span className="text-hashmark text-xs">Older →</span>
                <span className="font-display text-chalk group-hover:text-signal mt-1 font-semibold transition-colors">
                  {next.title}
                </span>
              </Link>
            ) : null}
          </nav>
        )}
      </article>

      <Faq faqs={guide.faqs} heading="Related questions" emitJsonLd={false} />
    </main>
  );
}
