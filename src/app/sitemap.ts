import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { LANDING_PAGES } from "@/lib/seo/landing-pages";
import { listGuides } from "@/lib/seo/guides";
import { LEAGUE_ID_GUIDES } from "@/lib/seo/league-id-guides";

// Dynamic, not ISR: the completed-draft list changes continuously, and the
// D1 binding only exists inside a request — a prerender at build time would
// have no database to read.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_BASE_URL;

  const now = new Date();
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
  ];
}
