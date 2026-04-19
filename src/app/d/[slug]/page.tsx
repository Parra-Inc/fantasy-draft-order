import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DraftLive } from "./draft-live";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const draft = await prisma.draft.findUnique({
    where: { slug },
    select: { leagueName: true },
  });
  if (!draft) return { title: "Draft not found" };
  return {
    title: `${draft.leagueName} — Draft Order`,
    description: `Live fantasy draft order for ${draft.leagueName}.`,
  };
}

export default async function DraftPage({ params }: Props) {
  const { slug } = await params;
  const draft = await prisma.draft.findUnique({
    where: { slug },
    include: {
      teams: { orderBy: { position: "asc" } },
    },
  });
  if (!draft) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <DraftLive
        slug={draft.slug}
        initial={{
          slug: draft.slug,
          leagueName: draft.leagueName,
          creatorName: draft.creatorName,
          scheduledFor: draft.scheduledFor.toISOString(),
          status: draft.status,
          importSource: draft.importSource,
          importLeagueId: draft.importLeagueId,
          seed: draft.seed,
          commitSha: draft.commitSha,
          startedAt: draft.startedAt?.toISOString() ?? null,
          completedAt: draft.completedAt?.toISOString() ?? null,
          createdAt: draft.createdAt.toISOString(),
          teams: draft.teams.map((t) => ({
            id: t.id,
            name: t.name,
            ownerName: t.ownerName,
            avatarUrl: t.avatarUrl,
            position: t.position,
          })),
          picks: [],
          nextPickAt: null,
          serverTime: new Date().toISOString(),
        }}
      />
    </main>
  );
}
