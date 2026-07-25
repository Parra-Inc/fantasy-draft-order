import Link from "next/link";
import { notFound } from "next/navigation";
import { toImportSource } from "@/lib/db-enums";
import { prisma } from "@/lib/prisma";
import { BrandMark } from "@/components/brand-mark";
import { Wordmark } from "@/components/wordmark";
import { buildMetadata, SITE_NAME } from "@/lib/seo/metadata";
import { BreadcrumbLd, EventLd } from "@/lib/seo/jsonld";
import { submitCompletedDraft } from "@/lib/indexnow";
import { deriveStatus, getRevealConfig, pickSpinStartAt } from "@/lib/reveal";
import { DraftLive } from "./draft-live";

type Props = { params: Promise<{ slug: string }> };

/**
 * Must render per request: reveal state is derived from the current clock, and
 * the IndexNow ping below only makes sense at request time. Without this, a
 * future `revalidate` / static-shell change could quietly move both to build or
 * ISR time, which would serve stale picks and submit URLs at the wrong moment.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const draft = await prisma.draft.findUnique({
    where: { slug },
    select: {
      leagueName: true,
      scheduledFor: true,
      teams: { select: { id: true } },
      picks: { select: { revealedAt: true }, orderBy: { pickNumber: "asc" } },
    },
  });
  if (!draft) {
    return buildMetadata({
      title: "Draft not found",
      description: "This draft order does not exist or has been removed.",
      path: `/d/${slug}`,
      noindex: true,
    });
  }

  const status = deriveStatus({ now: new Date(), picks: draft.picks });
  const teamCount = draft.teams.length;
  const when = draft.scheduledFor.toUTCString();
  const description =
    status === "COMPLETED"
      ? `${draft.leagueName} — final fantasy draft order for ${teamCount} teams, drawn live from open-source code with a permanent audit trail.`
      : `${draft.leagueName} — fantasy draft order draw for ${teamCount} teams, scheduled for ${when}. Watch it live, transparent and tamper-proof.`;

  return buildMetadata({
    title: `${draft.leagueName} — Draft Order`,
    description,
    path: `/d/${slug}`,
    image: `/d/${slug}/opengraph-image`,
    noindex: status !== "COMPLETED",
  });
}

export default async function DraftPage({ params }: Props) {
  const { slug } = await params;
  const draft = await prisma.draft.findUnique({
    where: { slug },
    include: {
      teams: { orderBy: { position: "asc" } },
      picks: { orderBy: { pickNumber: "asc" } },
    },
  });
  if (!draft) notFound();

  const now = new Date();
  const config = getRevealConfig();
  const initialStatus = deriveStatus({ now, picks: draft.picks });
  const picksByRevealAsc = [...draft.picks].sort(
    (a, b) => a.revealedAt.getTime() - b.revealedAt.getTime(),
  );
  const firstByReveal = picksByRevealAsc[0] ?? null;
  const lastByReveal = picksByRevealAsc[picksByRevealAsc.length - 1] ?? null;
  const startedAt =
    firstByReveal && firstByReveal.revealedAt <= now
      ? firstByReveal.revealedAt
      : null;
  const completedAt =
    lastByReveal && lastByReveal.revealedAt <= now
      ? lastByReveal.revealedAt
      : null;

  // Covers draws nobody watched live: the first render after completion is the
  // only signal that this URL just became indexable. Deduped, and the actual
  // POST runs in an after() callback, so this never delays or fails the render.
  if (completedAt) {
    submitCompletedDraft(draft.slug, completedAt);
  }

  const spinningPick = picksByRevealAsc.find((p) => {
    const start = pickSpinStartAt(p.revealedAt, config);
    return start <= now && p.revealedAt > now;
  });
  const initialCurrentSpin = spinningPick
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
  const initialNextPick =
    picksByRevealAsc.find((p) => p.revealedAt > now) ?? null;

  // Other draws for the same league, matched case-insensitively.
  //
  // Prisma's `mode: "insensitive"` is Postgres-only, and on SQLite `equals`
  // compiles to a case-sensitive `=`. `contains` compiles to LIKE, which IS
  // case-insensitive for ASCII in SQLite, so it does the filtering in the
  // database — but as a substring match it returns a superset (and would
  // over-match a name containing % or _). The exact comparison below narrows
  // it back down, so the visible behavior matches what Postgres did.
  const SIBLING_LIMIT = 25;
  const siblingCandidates = await prisma.draft.findMany({
    where: {
      leagueName: { contains: draft.leagueName },
      slug: { not: draft.slug },
    },
    select: {
      slug: true,
      leagueName: true,
      scheduledFor: true,
      createdAt: true,
      picks: { select: { revealedAt: true }, orderBy: { pickNumber: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    // Over-fetch a little so the exact filter below rarely truncates a real
    // match in favor of a substring one.
    take: SIBLING_LIMIT * 4,
  });
  const targetName = draft.leagueName.toLowerCase();
  const siblings = siblingCandidates
    .filter((s) => s.leagueName.toLowerCase() === targetName)
    .slice(0, SIBLING_LIMIT)
    .map((s) => ({
      slug: s.slug,
      leagueName: s.leagueName,
      scheduledFor: s.scheduledFor.toISOString(),
      createdAt: s.createdAt.toISOString(),
      status: deriveStatus({ now, picks: s.picks }),
    }));

  return (
    <div className="flex min-h-full flex-col">
      <BreadcrumbLd
        items={[
          { name: "Home", path: "/" },
          { name: draft.leagueName, path: `/d/${slug}` },
        ]}
      />
      <EventLd
        name={`${draft.leagueName} draft order draw`}
        startDate={draft.scheduledFor.toISOString()}
        endDate={completedAt?.toISOString()}
        url={`/d/${slug}`}
        status={initialStatus}
        organizerName={draft.creatorName ?? SITE_NAME}
      />
      <header className="border-sideline/50 bg-midnight/90 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark />
            <Wordmark />
          </Link>
          <Link
            href={`/new?from=${slug}&src=DRAFT_HEADER`}
            className="bg-signal text-midnight hover:bg-signal-dark inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors"
          >
            Schedule the draw
          </Link>
        </div>
      </header>
      <main className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-signal/5 absolute top-0 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-[120px]" />
        </div>
        <div className="relative mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <DraftLive
            slug={draft.slug}
            siblings={siblings}
            initial={{
              slug: draft.slug,
              leagueName: draft.leagueName,
              creatorName: draft.creatorName,
              scheduledFor: draft.scheduledFor.toISOString(),
              status: initialStatus,
              importSource: toImportSource(draft.importSource),
              importLeagueId: draft.importLeagueId,
              seed: draft.seed,
              commitSha: draft.commitSha,
              startedAt: startedAt?.toISOString() ?? null,
              completedAt: completedAt?.toISOString() ?? null,
              createdAt: draft.createdAt.toISOString(),
              teams: draft.teams.map((t) => ({
                id: t.id,
                name: t.name,
                ownerName: t.ownerName,
                avatarUrl: t.avatarUrl,
                position: t.position,
              })),
              picks: draft.picks
                .filter((p) => p.revealedAt <= now)
                .map((p) => ({
                  teamId: p.teamId,
                  pickNumber: p.pickNumber,
                  revealedAt: p.revealedAt.toISOString(),
                })),
              currentSpin: initialCurrentSpin,
              spinDurationMs: config.spinDurationMs,
              nextPickAt: initialNextPick?.revealedAt.toISOString() ?? null,
              serverTime: now.toISOString(),
            }}
          />
        </div>
      </main>
    </div>
  );
}
