import { NextResponse } from "next/server";
import { toImportSource } from "@/lib/db-enums";
import { prisma } from "@/lib/prisma";
import { submitCompletedDraft } from "@/lib/indexnow";
import { deriveStatus, getRevealConfig, pickSpinStartAt } from "@/lib/reveal";

// Polled by every viewer during a draw, and the D1 binding only exists inside
// a request: never cache or prerender this.
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
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
  const config = getRevealConfig();
  const status = deriveStatus({ now, picks: draft.picks });
  const revealedPicks = draft.picks
    .filter((p) => p.revealedAt <= now)
    .sort((a, b) => a.pickNumber - b.pickNumber);

  const picksByRevealAsc = [...draft.picks].sort(
    (a, b) => a.revealedAt.getTime() - b.revealedAt.getTime(),
  );
  const firstByReveal = picksByRevealAsc[0] ?? null;
  const lastByReveal = picksByRevealAsc[picksByRevealAsc.length - 1] ?? null;

  const spinningPick = picksByRevealAsc.find((p) => {
    const start = pickSpinStartAt(p.revealedAt, config);
    return start <= now && p.revealedAt > now;
  });
  const currentSpin = spinningPick
    ? {
        teamId: spinningPick.teamId,
        pickNumber: spinningPick.pickNumber,
        revealedAt: spinningPick.revealedAt.toISOString(),
        spinStartAt: pickSpinStartAt(
          spinningPick.revealedAt,
          config,
        ).toISOString(),
      }
    : null;

  const nextPick = picksByRevealAsc.find((p) => p.revealedAt > now) ?? null;

  // The page flips from noindex to indexable the moment the last pick lands,
  // and pollers watching the draw are the first to see it. Fire-and-forget.
  if (status === "COMPLETED" && lastByReveal) {
    submitCompletedDraft(draft.slug, lastByReveal.revealedAt);
  }

  return NextResponse.json({
    slug: draft.slug,
    leagueName: draft.leagueName,
    creatorName: draft.creatorName,
    scheduledFor: draft.scheduledFor.toISOString(),
    status,
    importSource: toImportSource(draft.importSource),
    importLeagueId: draft.importLeagueId,
    seed: draft.seed,
    commitSha: draft.commitSha,
    startedAt:
      firstByReveal && firstByReveal.revealedAt <= now
        ? firstByReveal.revealedAt.toISOString()
        : null,
    completedAt:
      lastByReveal && lastByReveal.revealedAt <= now
        ? lastByReveal.revealedAt.toISOString()
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
    currentSpin,
    spinDurationMs: config.spinDurationMs,
    nextPickAt: nextPick ? nextPick.revealedAt.toISOString() : null,
    serverTime: now.toISOString(),
  });
}
