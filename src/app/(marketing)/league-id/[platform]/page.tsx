import { notFound } from "next/navigation";
import { LeagueIdGuideView } from "@/components/marketing/league-id-guide";
import { LEAGUE_ID_GUIDES, getLeagueIdGuide } from "@/lib/seo/league-id-guides";
import { buildMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ platform: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LEAGUE_ID_GUIDES.map((g) => ({ platform: g.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { platform } = await params;
  const guide = getLeagueIdGuide(platform);
  if (!guide) {
    return buildMetadata({
      title: "League ID guide not found",
      description: "This league ID guide does not exist.",
      path: `/league-id/${platform}`,
      noindex: true,
    });
  }
  return buildMetadata({
    title: guide.title,
    description: guide.description,
    path: `/league-id/${guide.slug}`,
    keywords: guide.keywords,
    type: "article",
  });
}

export default async function LeagueIdPlatformPage({ params }: Props) {
  const { platform } = await params;
  const guide = getLeagueIdGuide(platform);
  if (!guide) notFound();
  return <LeagueIdGuideView guide={guide} />;
}
