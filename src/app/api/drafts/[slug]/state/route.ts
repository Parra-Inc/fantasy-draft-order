import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveStatus } from "@/lib/reveal";

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
  const status = deriveStatus({ now, picks: draft.picks });
  const revealedPicks = draft.picks.filter((p) => p.revealedAt <= now);
  const nextPick = draft.picks.find((p) => p.revealedAt > now) ?? null;
  const firstPick = draft.picks[0] ?? null;
  const lastPick = draft.picks[draft.picks.length - 1] ?? null;

  return NextResponse.json({
    slug: draft.slug,
    leagueName: draft.leagueName,
    creatorName: draft.creatorName,
    scheduledFor: draft.scheduledFor.toISOString(),
    status,
    importSource: draft.importSource,
    importLeagueId: draft.importLeagueId,
    seed: draft.seed,
    commitSha: draft.commitSha,
    startedAt:
      firstPick && firstPick.revealedAt <= now
        ? firstPick.revealedAt.toISOString()
        : null,
    completedAt:
      lastPick && lastPick.revealedAt <= now
        ? lastPick.revealedAt.toISOString()
        : null,
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
