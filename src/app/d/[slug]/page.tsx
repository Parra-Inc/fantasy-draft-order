import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BrandMark } from "@/components/brand-mark";
import { buildMetadata, SITE_NAME } from "@/lib/seo/metadata";
import { BreadcrumbLd, EventLd } from "@/lib/seo/jsonld";
import { deriveStatus } from "@/lib/reveal";
import { DraftLive } from "./draft-live";

type Props = { params: Promise<{ slug: string }> };

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
  const initialStatus = deriveStatus({ now, picks: draft.picks });
  const firstPick = draft.picks[0] ?? null;
  const lastPick = draft.picks[draft.picks.length - 1] ?? null;
  const startedAt =
    firstPick && firstPick.revealedAt <= now ? firstPick.revealedAt : null;
  const completedAt =
    lastPick && lastPick.revealedAt <= now ? lastPick.revealedAt : null;

  const siblingsRaw = await prisma.draft.findMany({
    where: {
      leagueName: { equals: draft.leagueName, mode: "insensitive" },
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
    take: 25,
  });
  const siblings = siblingsRaw.map((s) => ({
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
      <header className="border-b border-sideline/50 bg-midnight/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-base font-bold tracking-tight text-chalk sm:text-lg">
              Fantasy Draft Order
            </span>
          </Link>
          <Link
            href="/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-signal px-4 text-sm font-semibold text-midnight transition-colors hover:bg-signal-dark"
          >
            New draft
          </Link>
        </div>
      </header>
      <main className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-signal/5 blur-[120px]" />
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
              importSource: draft.importSource,
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
              nextPickAt:
                draft.picks.find((p) => p.revealedAt > now)?.revealedAt.toISOString() ??
                null,
              serverTime: now.toISOString(),
            }}
          />
        </div>
      </main>
    </div>
  );
}
