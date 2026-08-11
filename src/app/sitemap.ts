import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { LANDING_PAGES } from "@/lib/seo/landing-pages";
import { listGuides } from "@/lib/seo/guides";
import { LEAGUE_ID_GUIDES } from "@/lib/seo/league-id-guides";

/**
 * Fallback date for pages that have no real modification date of their own.
 *
 * A CONSTANT, not `new Date()`. Generating it at request time made every such
 * page report as modified on every fetch, which tells crawlers the whole site
 * changes constantly and devalues the signal. It also made IndexNow submissions
 * look like a full-site change every day. Bump it by hand when the static page
 * content meaningfully changes: a stale-but-honest date beats a fresh lie.
 */
const SITE_LAST_MODIFIED = new Date('2026-08-02')

// Dynamic, not ISR: the completed-draft list changes continuously, and the
// D1 binding only exists inside a request — a prerender at build time would
// have no database to read.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_BASE_URL;

  const now = SITE_LAST_MODIFIED;
  const completedRows = await prisma.draft
    .findMany({
      where: { picks: { some: { revealedAt: { lte: now } } } },
      select: {
        slug: true,
        picks: {
          select: { revealedAt: true },
          orderBy: { pickNumber: "desc" },
          take: 1,
        },
      },
      take: 5000,
    })
    .catch(() => []);
  const completed = completedRows
    .filter((d) => d.picks[0] && d.picks[0].revealedAt <= now)
    .map((d) => ({ slug: d.slug, completedAt: d.picks[0]!.revealedAt }));

  // Punishment wheels, same rule as drafts: a wheel is noindex (and worth
  // nothing to a crawler) until its result exists.
  const completedWheels = await prisma.punishment
    .findMany({
      where: { revealedAt: { lte: now } },
      select: { slug: true, revealedAt: true },
      orderBy: { revealedAt: "desc" },
      take: 5000,
    })
    .catch(() => []);

  const guides = listGuides();

  return [
    {
      url: `${base}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/new`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/guides`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/league-id`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/ask-your-commissioner`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/fantasy-football-facebook-groups`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      // Grows as submissions are approved, hence weekly.
      url: `${base}/fantasy-football-punishments`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/punishment/new`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...LEAGUE_ID_GUIDES.map((g) => ({
      url: `${base}/league-id/${g.slug}`,
      lastModified: new Date(g.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...LANDING_PAGES.map((p) => ({
      url: `${base}/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...guides.map((g) => ({
      url: `${base}/guides/${g.slug}`,
      lastModified: new Date(g.dateModified ?? g.datePublished),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...completed.map((d) => ({
      url: `${base}/d/${d.slug}`,
      lastModified: d.completedAt,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
    ...completedWheels.map((p) => ({
      url: `${base}/p/${p.slug}`,
      lastModified: p.revealedAt,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    })),
  ];
}
