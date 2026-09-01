import Link from "next/link";
import { notFound } from "next/navigation";
import { toImportSource } from "@/lib/db-enums";
import { withD1Retry } from "@/lib/d1-retry";
import { prisma } from "@/lib/prisma";
import { BrandMark } from "@/components/brand-mark";
import { Wordmark } from "@/components/wordmark";
import { buildMetadata, SITE_NAME } from "@/lib/seo/metadata";
import { BreadcrumbLd, EventLd } from "@/lib/seo/jsonld";
import { deriveStatus, getRevealConfig, pickSpinStartAt } from "@/lib/reveal";
import { DraftLive } from "./draft-live";

type Props = { params: Promise<{ slug: string }> };

/**
 * Must render per request: reveal state is derived from the current clock, and
 * the D1 binding only exists inside a request. Without this, a future
 * `revalidate` / static-shell change could quietly move the render to build or
 * ISR time, which would serve stale picks.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const draft = await withD1Retry(() =>
    prisma.draft.findUnique({
      where: { slug },
      select: {
        leagueName: true,
        scheduledFor: true,
        teams: { select: { id: true } },
        picks: { select: { revealedAt: true }, orderBy: { pickNumber: "asc" } },
      },
    }),
  );
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
  const draft = await withD1Retry(() =>
    prisma.draft.findUnique({
      where: { slug },
      include: {
        teams: { orderBy: { position: "asc" } },
        picks: { orderBy: { pickNumber: "asc" } },
      },
    }),
  );
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

  // No IndexNow ping here. A page view is not a publish event, and firing one
  // per render submitted the same completed draw over and over until IndexNow
  // rate limited us. sitemap.xml already lists every completed draw with its
  // real lastModified, which is the channel engines actually read.

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
  // This has to be D1-safe. The old approach used `leagueName: { contains }`
  // (a LIKE) to get case-insensitive matching, over-fetched 100 candidates and
  // filtered down to an exact match in JS. On Cloudflare D1 that produced two
  // deterministic 500s on completed draws:
  //   1. Some league names make a pattern D1 rejects outright, e.g. a name with
  //      unbalanced parentheses triggered "LIKE or GLOB pattern too complex".
  //   2. Loading the `picks` relation for ~100 candidates bound their ids in a
  //      single `IN (...)`, which for a common league name blew past D1's
  //      100-bound-variable limit ("too many SQL variables").
  // Prisma still can't do a case-insensitive `equals` on SQLite, so the match
  // is a raw `lower()` compare (one bound value, no LIKE). SIBLING_LIMIT caps
  // the follow-up picks load far under the variable limit, and the whole block
  // is best-effort: the sibling list is a convenience and must never take the
  // draw itself down with it.
  const SIBLING_LIMIT = 25;
  type Sibling = {
    slug: string;
    leagueName: string;
    scheduledFor: string;
    createdAt: string;
    status: ReturnType<typeof deriveStatus>;
  };
  let siblings: Sibling[] = [];
  try {
    const siblingSlugRows = await withD1Retry(() =>
      prisma.$queryRaw<{ slug: string }[]>`
        SELECT slug FROM Draft
        WHERE lower(leagueName) = lower(${draft.leagueName})
          AND slug <> ${draft.slug}
        ORDER BY createdAt DESC
        LIMIT ${SIBLING_LIMIT}
      `,
    );
    const siblingSlugs = siblingSlugRows.map((row) => row.slug);
    if (siblingSlugs.length > 0) {
      const siblingDrafts = await withD1Retry(() =>
        prisma.draft.findMany({
          where: { slug: { in: siblingSlugs } },
          select: {
            slug: true,
            leagueName: true,
            scheduledFor: true,
            createdAt: true,
            picks: {
              select: { revealedAt: true },
              orderBy: { pickNumber: "asc" },
            },
          },
        }),
      );
      // findMany does not preserve the createdAt DESC order of the id list, so
      // re-apply it from siblingSlugs.
      const bySlug = new Map(siblingDrafts.map((s) => [s.slug, s]));
      siblings = siblingSlugs
        .map((s) => bySlug.get(s))
        .filter((s): s is (typeof siblingDrafts)[number] => Boolean(s))
        .map((s) => ({
          slug: s.slug,
          leagueName: s.leagueName,
          scheduledFor: s.scheduledFor.toISOString(),
          createdAt: s.createdAt.toISOString(),
          status: deriveStatus({ now, picks: s.picks }),
        }));
    }
  } catch (err) {
    // Never 500 the draw over the sibling list. Log and render without it.
    console.warn(
      `sibling lookup failed for /d/${slug}, rendering without it`,
      err,
    );
  }

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
        {/* Tracks the content container below, which widens at `lg` to make
            room for the sticky promo rail. */}
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:max-w-[78rem]">
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
        {/* 78rem is 56rem of content (the old max-w-4xl) plus the 20rem promo
            rail and its 2rem gap, so the draw column keeps its width on the
            widest screens rather than being squeezed by the new aside. */}
        <div className="relative mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:max-w-[78rem]">
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
