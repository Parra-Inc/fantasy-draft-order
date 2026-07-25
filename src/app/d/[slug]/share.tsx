"use client";

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { env } from "@/lib/env";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  Download,
  RefreshCw,
  Share2,
  Trophy,
  UserRound,
} from "lucide-react";

/**
 * The sharing surfaces on a draft page.
 *
 * Everything here exists to turn viewers into creators. A completed draw puts
 * the whole league on one page at the same second, which is the only moment
 * this product ever gets that attention, so the call to action fires there
 * rather than living in a header nobody looks at during a countdown.
 *
 * None of it writes to the database. "Which team are you" is localStorage on
 * purpose: the product's promise is that a scheduled draft is immutable and
 * account-free, and a claim that touched the server would be the first crack in
 * that. It only ever personalizes copy.
 */

type Team = { id: string; name: string; ownerName: string | null };

function storageKey(slug: string) {
  return `ffdo:team:${slug}`;
}

/**
 * Fallback for browsers where localStorage throws (private mode, storage
 * disabled). The choice then lasts for the session instead of forever, which
 * is a much better outcome than the picker silently refusing to stick.
 */
const memory = new Map<string, string | null>();

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab watching the same draw should agree about who you are.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readTeamId(slug: string): string | null {
  const key = storageKey(slug);
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function writeTeamId(slug: string, teamId: string | null) {
  const key = storageKey(slug);
  memory.set(key, teamId);
  try {
    if (teamId) window.localStorage.setItem(key, teamId);
    else window.localStorage.removeItem(key);
  } catch {
    // Kept in `memory` above.
  }
  for (const listener of listeners) listener();
}

/**
 * Which team the viewer says they are, remembered per draft.
 *
 * useSyncExternalStore rather than useState-in-an-effect because localStorage
 * is exactly the external store it exists for: the server snapshot is null, so
 * the first client render matches the server and there is no hydration
 * mismatch, and no cascading render on mount.
 */
export function useMyTeam(slug: string, teams: Team[]) {
  const stored = useSyncExternalStore(
    subscribe,
    () => readTeamId(slug),
    () => null,
  );

  // Guard against a team that no longer exists: a stale id would silently
  // personalize nothing, which looks like a bug rather than a cleared choice.
  const myTeamId =
    stored && teams.some((t) => t.id === stored) ? stored : null;

  const choose = useCallback(
    (teamId: string | null) => writeTeamId(slug, teamId),
    [slug],
  );

  return { myTeamId, choose };
}

function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/**
 * "Which team are you?" Shown before the draw so the reveal lands personally,
 * and again on the results panel for anyone who arrives late.
 */
export function TeamPicker({
  teams,
  myTeamId,
  onChoose,
  compact = false,
}: {
  teams: Team[];
  myTeamId: string | null;
  onChoose: (teamId: string | null) => void;
  compact?: boolean;
}) {
  const mine = teams.find((t) => t.id === myTeamId) ?? null;

  if (mine) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <UserRound className="text-signal size-4 shrink-0" />
        <span className="text-hashmark">You are</span>
        <span className="text-chalk font-semibold">{mine.name}</span>
        <button
          type="button"
          onClick={() => onChoose(null)}
          className="text-hashmark hover:text-chalk text-xs underline underline-offset-2 transition-colors"
        >
          change
        </button>
      </div>
    );
  }

  return (
    <div className={compact ? "" : "space-y-2.5"}>
      <p className="text-hashmark flex items-center gap-2 text-sm">
        <UserRound className="text-signal size-4 shrink-0" />
        Which team are you?
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {teams.map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => onChoose(team.id)}
            className="border-sideline/60 bg-midnight/50 text-hashmark hover:border-signal/40 hover:text-chalk rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
          >
            {team.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Adds the draw to a calendar. See src/app/d/[slug]/draft.ics/route.ts. */
export function AddToCalendarButton({ slug }: { slug: string }) {
  return (
    <a
      href={`/d/${slug}/draft.ics`}
      className="border-sideline/60 bg-midnight/50 text-chalk hover:border-signal/40 inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition-colors"
    >
      <CalendarPlus className="size-4" />
      Add to calendar
    </a>
  );
}

/**
 * The results share panel: the artifact people actually post.
 *
 * Prefers sharing the PNG itself over a link. On a phone that puts the result
 * into iMessage or Instagram as an image, which is a different act from pasting
 * a URL and converts far better; the URL share and the clipboard are fallbacks
 * for browsers without file sharing (desktop Safari, Firefox).
 */
export function ResultShare({
  slug,
  leagueName,
  teams,
  picks,
  myTeamId,
  onChoose,
}: {
  slug: string;
  leagueName: string;
  teams: Team[];
  picks: { teamId: string; pickNumber: number }[];
  myTeamId: string | null;
  onChoose: (teamId: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // The canonical origin, not window.location.origin: this URL is about to be
  // pasted somewhere permanent, and it should say fantasyfootballdraftorder.com
  // even when the page was opened on the workers.dev fallback host.
  const url = `${env.NEXT_PUBLIC_BASE_URL}/d/${slug}`;
  const myPick = myTeamId
    ? (picks.find((p) => p.teamId === myTeamId) ?? null)
    : null;
  const myTeam = teams.find((t) => t.id === myTeamId) ?? null;
  const cardUrl = `/d/${slug}/card${myPick ? `?t=${myTeamId}` : ""}`;

  const shareText = myPick
    ? `I got the ${myPick.pickNumber}${ordinalSuffix(myPick.pickNumber)} pick of ${teams.length} in ${leagueName}.\n\nDrawn live from open-source code, with the seed recorded before anyone saw it:`
    : `${leagueName} draft order, drawn live from open-source code:\n\n${picks
        .slice()
        .sort((a, b) => a.pickNumber - b.pickNumber)
        .slice(0, 3)
        .map(
          (p) =>
            `${p.pickNumber}. ${teams.find((t) => t.id === p.teamId)?.name ?? ""}`,
        )
        .join("\n")}\n`;

  async function share() {
    setBusy(true);
    try {
      // Best case: hand the OS the actual image.
      if (typeof navigator.share === "function") {
        try {
          const res = await fetch(cardUrl);
          if (res.ok) {
            const blob = await res.blob();
            const file = new File([blob], `${slug}-draft-order.png`, {
              type: "image/png",
            });
            if (navigator.canShare?.({ files: [file] })) {
              await navigator.share({
                files: [file],
                text: `${shareText}\n${url}`,
              });
              return;
            }
          }
        } catch {
          // Fall through to the link share below.
        }
        await navigator.share({
          title: `${leagueName} draft order`,
          text: shareText,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      // AbortError just means the user dismissed the share sheet.
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Could not share. Copy the link instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border-signal/30 bg-signal/5 space-y-4 rounded-2xl border p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Trophy className="text-signal size-4 shrink-0" />
        <p className="text-signal font-mono text-[11px] font-medium tracking-wider uppercase sm:text-xs">
          {myPick ? "Your pick is in" : "Share the result"}
        </p>
      </div>

      {myPick && myTeam ? (
        <p className="font-display text-chalk text-2xl font-bold sm:text-3xl">
          {myTeam.name} picks{" "}
          <span className="text-signal">
            {myPick.pickNumber}
            {ordinalSuffix(myPick.pickNumber)}
          </span>{" "}
          <span className="text-hashmark text-xl font-semibold sm:text-2xl">
            of {teams.length}
          </span>
        </p>
      ) : (
        <TeamPicker teams={teams} myTeamId={myTeamId} onChoose={onChoose} />
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={share}
          disabled={busy}
          className="bg-signal text-midnight hover:bg-signal-dark inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {copied ? (
            <>
              <Check className="size-4" />
              Copied
            </>
          ) : (
            <>
              <Share2 className="size-4" />
              Share {myPick ? "your pick" : "the order"}
            </>
          )}
        </button>
        <a
          href={cardUrl}
          download={`${slug}-draft-order.png`}
          className="border-sideline/60 bg-midnight/50 text-chalk hover:border-signal/40 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border px-5 text-sm font-semibold transition-colors"
        >
          <Download className="size-4" />
          Download image
        </a>
      </div>
    </section>
  );
}

/**
 * The call to action, fired at the emotional peak: the last pick has landed and
 * every manager in the league is still looking at the page. Two branches,
 * because "run this again for this league" (keeper order, waiver order) and
 * "run this for my other league" are different jobs and the second one is the
 * one that actually grows anything.
 */
export function AfterDrawCta({
  slug,
  leagueName,
}: {
  slug: string;
  leagueName: string;
}) {
  return (
    <section className="border-sideline/50 bg-sideline/20 rounded-2xl border p-6 sm:p-8">
      <h3 className="font-display text-chalk text-2xl font-bold tracking-tight sm:text-3xl">
        In another league?
      </h3>
      <p className="text-hashmark mt-2 max-w-xl text-sm leading-relaxed">
        Somebody in that one is still setting the draft order by themselves, in
        private, and asking everyone to take their word for it. This takes about
        a minute and nobody has to take anyone&apos;s word for anything.
      </p>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <Link
          href={`/new?from=${slug}&src=AFTER_DRAW`}
          className="bg-signal text-midnight hover:bg-signal-dark shadow-signal/20 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold shadow-lg transition-colors"
        >
          Set one up for your other league
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href={`/new?from=${slug}&src=AFTER_DRAW_RERUN&clone=${slug}`}
          className="border-sideline/60 bg-midnight/50 text-chalk hover:border-signal/40 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border px-5 text-sm font-semibold transition-colors"
        >
          <RefreshCw className="size-4" />
          Draw again for {leagueName}
        </Link>
      </div>
      <p className="text-hashmark/70 mt-3 text-xs">
        Re-drawing creates a separate draft with its own link and its own seed.
        This one is permanent and cannot be changed.
      </p>
    </section>
  );
}
