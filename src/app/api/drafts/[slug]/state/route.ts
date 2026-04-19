import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const draft = await prisma.draft.findUnique({
    where: { slug },
    include: {
      teams: { orderBy: { position: "asc" } },
      picks: { orderBy: { pickNumber: "asc" } },
    },
  });
  if (!draft) return NextResponse.json({ error: "not found" }, { status: 404 });

  const now = new Date();
  const revealedPicks = draft.picks.filter((p) => p.revealedAt <= now);
  const nextPick = draft.picks.find((p) => p.revealedAt > now) ?? null;

  return NextResponse.json({
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
    picks: revealedPicks.map((p) => ({
      teamId: p.teamId,
      pickNumber: p.pickNumber,
      revealedAt: p.revealedAt.toISOString(),
    })),
    nextPickAt: nextPick ? nextPick.revealedAt.toISOString() : null,
    serverTime: now.toISOString(),
  });
}
