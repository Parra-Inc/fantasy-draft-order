import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { Wordmark } from "@/components/wordmark";
import { submitCompletedWheel } from "@/lib/indexnow";
import { prisma } from "@/lib/prisma";
import { serializePunishmentState } from "@/lib/punishment-state";
import { BreadcrumbLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { WheelLive } from "./wheel-live";

type Props = { params: Promise<{ slug: string }> };

/**
 * Must render per request: the status is derived from the current clock and the
 * IndexNow ping below only makes sense at request time. Also the D1 binding
 * only exists inside a request, so this could not be prerendered regardless.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const punishment = await prisma.punishment.findUnique({
    where: { slug },
    include: { options: { orderBy: { position: "asc" } } },
  });
  if (!punishment) {
    return buildMetadata({
      title: "Punishment wheel not found",
      description: "This punishment wheel does not exist or has been removed.",
      path: `/p/${slug}`,
      noindex: true,
    });
  }

  const state = serializePunishmentState(punishment);
  const description = state.chosen
    ? `${state.loserName} finished last in ${state.leagueName} and drew their punishment live from ${state.options.length} options: ${state.chosen.label}.`
    : `${state.loserName} finished last in ${state.leagueName}. One of ${state.options.length} punishments will be drawn live, from open-source code, at the scheduled time.`;

  return buildMetadata({
    title: `${state.loserName} — Punishment Wheel`,
    description,
    path: `/p/${slug}`,
    image: `/p/${slug}/opengraph-image`,
    // Same rule as drafts: nothing worth indexing exists until the result does,
    // and indexing a countdown would put a permanently stale page in results.
    noindex: state.status !== "COMPLETED",
  });
}

export default async function PunishmentPage({ params }: Props) {
  const { slug } = await params;
  const punishment = await prisma.punishment.findUnique({
    where: { slug },
    include: { options: { orderBy: { position: "asc" } } },
  });
  if (!punishment) notFound();

  // The one place the result is allowed out, shared with the state endpoint so
  // the two can never disagree about when that is.
  const state = serializePunishmentState(punishment);

  // Covers wheels nobody watched live: the first render after the reveal is the
  // only signal that this URL just became indexable. Deduped, and the POST runs
  // in an after() callback, so it never delays or fails the render.
  if (state.status === "COMPLETED") {
    submitCompletedWheel(punishment.slug, punishment.revealedAt);
  }

  return (
    <div className="flex min-h-full flex-col">
      <BreadcrumbLd
        items={[
          { name: "Home", path: "/" },
          { name: "Punishments", path: "/fantasy-football-punishments" },
          { name: state.leagueName, path: `/p/${slug}` },
        ]}
      />
      <header className="border-sideline/50 bg-midnight/90 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark />
            <Wordmark />
          </Link>
          <Link
            href="/fantasy-football-punishments"
            className="bg-signal text-midnight hover:bg-signal-dark inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors"
          >
            Spin your own
          </Link>
        </div>
      </header>
      <main className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-signal/5 absolute top-0 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-[120px]" />
        </div>
        <div className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <WheelLive slug={state.slug} initial={state} />
        </div>
      </main>
    </div>
  );
}
