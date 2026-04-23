import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BrandMark } from "@/components/brand-mark";
import { buildMetadata, SITE_NAME } from "@/lib/seo/metadata";
import { BreadcrumbLd, EventLd } from "@/lib/seo/jsonld";
import { DraftLive } from "./draft-live";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const draft = await prisma.draft.findUnique({
    where: { slug },
    select: {
      leagueName: true,
      status: true,
      scheduledFor: true,
      teams: { select: { id: true } },
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

  const teamCount = draft.teams.length;
  const when = draft.scheduledFor.toUTCString();
  const description =
    draft.status === "COMPLETED"
      ? `${draft.leagueName} — final fantasy draft order for ${teamCount} teams, drawn live from open-source code with a permanent audit trail.`
      : `${draft.leagueName} — fantasy draft order draw for ${teamCount} teams, scheduled for ${when}. Watch it live, transparent and tamper-proof.`;

  return buildMetadata({
    title: `${draft.leagueName} — Draft Order`,
    description,
    path: `/d/${slug}`,
    image: `/d/${slug}/opengraph-image`,
    noindex: draft.status !== "COMPLETED",
  });
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
        endDate={draft.completedAt?.toISOString()}
        url={`/d/${slug}`}
        status={draft.status}
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
        </div>
      </main>
    </div>
  );
}
