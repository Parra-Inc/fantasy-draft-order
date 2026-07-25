"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { env } from "@/lib/env";
import { Popover } from "@/components/popover";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  Download,
  ImageIcon,
  Link2,
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
  const myTeamId = stored && teams.some((t) => t.id === stored) ? stored : null;

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

/** Nothing to subscribe to: neither capability below changes after mount. */
const noSubscribe = () => () => {};

function readTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    // Leave the card on UTC.
    return null;
  }
}

/**
 * Everything only the browser can answer.
 *
 * `navigator.share` and the IANA time zone both differ between the worker that
 * rendered this HTML and the phone reading it, and the zone ends up in the card
 * URL, which is an href in the markup. useSyncExternalStore is what keeps that
 * honest: the server snapshot says "no zone, no share sheet", so the first
 * client render matches the HTML exactly and the real values land right after.
 */
function useClientCapabilities() {
  const canShare = useSyncExternalStore(
    noSubscribe,
    () => typeof navigator.share === "function",
    () => false,
  );
  const tz = useSyncExternalStore(noSubscribe, readTimeZone, () => null);
  return { canShare, tz };
}

/**
 * The results share panel: the artifact people actually post.
 *
 * The one button hides a real fork, so it opens a popover instead of guessing:
 * the image and the link travel very differently. The PNG is what lands in
 * iMessage or a story and it carries the whole result with it, but it is a dead
 * end; the link is what actually brings the next league here. Sharing the image
 * with the URL in the message text is the best of both, so that is what the
 * first row does, and the rest are there for when it is not what someone wants.
 *
 * With a team claimed, both artifacts default to that team's pick, with a
 * toggle back to the whole order. That claim is localStorage only, never a
 * server write.
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
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const { canShare, tz } = useClientCapabilities();

  // The canonical origin, not window.location.origin: this URL is about to be
  // pasted somewhere permanent, and it should say fantasyfootballdraftorder.com
  // even when the page was opened on the workers.dev fallback host.
  const url = `${env.NEXT_PUBLIC_BASE_URL}/d/${slug}`;
  const myPick = myTeamId
    ? (picks.find((p) => p.teamId === myTeamId) ?? null)
    : null;
  const myTeam = teams.find((t) => t.id === myTeamId) ?? null;
  // The toggle only exists once a team is claimed, so "mine" with no pick is
  // just the whole order.
  const activePick = scope === "mine" ? myPick : null;
  const mine = activePick !== null;

  const cardUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (mine && myTeamId) params.set("t", myTeamId);
    // Without this the worker has no zone and stamps the card in UTC, which is
    // never the time the league agreed to meet at.
    if (tz) params.set("tz", tz);
    const query = params.toString();
    return `/d/${slug}/card${query ? `?${query}` : ""}`;
  }, [slug, mine, myTeamId, tz]);

  const fileName = `${slug}-draft-order${mine ? "-my-pick" : ""}.png`;

  const shareText = activePick
    ? `I got the ${activePick.pickNumber}${ordinalSuffix(activePick.pickNumber)} pick of ${teams.length} in ${leagueName}.\n\nDrawn live from open-source code, with the seed recorded before anyone saw it:`
    : `${leagueName} draft order, drawn live from open-source code:\n\n${picks
        .slice()
        .sort((a, b) => a.pickNumber - b.pickNumber)
        .slice(0, 3)
        .map(
          (p) =>
            `${p.pickNumber}. ${teams.find((t) => t.id === p.teamId)?.name ?? ""}`,
        )
        .join("\n")}\n`;

  function flashCopied() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  /** Hands the OS the actual PNG, with the link in the message text. */
  async function shareImage() {
    setBusy(true);
    try {
      const res = await fetch(cardUrl);
      if (!res.ok) throw new Error(`card ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (!navigator.canShare?.({ files: [file] })) {
        // Desktop Safari and Firefox have navigator.share but no file support.
        await shareLink();
        return;
      }
      await navigator.share({ files: [file], text: `${shareText}\n${url}` });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Could not share the image. Try downloading it instead.");
    } finally {
      setBusy(false);
    }
  }

  async function shareLink() {
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `${leagueName} draft order`,
          text: shareText,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(`${shareText}\n${url}`);
      flashCopied();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Could not share. Copy the link instead.");
    }
  }

  async function copyLink(close: () => void) {
    try {
      await navigator.clipboard.writeText(url);
      flashCopied();
      close();
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  const itemClass =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-chalk transition-colors hover:bg-sideline/60 focus-visible:bg-sideline/60 disabled:opacity-60";

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
        <Popover
          label="Share options"
          triggerClassName="bg-signal text-midnight hover:bg-signal-dark inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold transition-colors sm:w-auto"
          trigger={
            copied ? (
              <>
                <Check className="size-4" />
                Copied
              </>
            ) : (
              <>
                <Share2 className="size-4" />
                Share {mine ? "your pick" : "the order"}
              </>
            )
          }
        >
          {(close) => (
            <div className="space-y-3">
              {/* The card is the point, so show the actual card. It is the
                  same URL the buttons below use, so this costs one render that
                  is then served from cache. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cardUrl}
                alt={
                  mine
                    ? `${myTeam?.name ?? "Your team"}'s pick`
                    : `${leagueName} draft order`
                }
                className="border-sideline/60 bg-midnight w-full rounded-xl border"
              />

              {myPick && (
                <div className="border-sideline/60 bg-midnight/60 flex rounded-xl border p-1">
                  {(
                    [
                      ["mine", "Your pick"],
                      ["all", "Whole order"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setScope(value)}
                      aria-pressed={scope === value}
                      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        scope === value
                          ? "bg-signal text-midnight"
                          : "text-hashmark hover:text-chalk"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-0.5">
                {canShare && (
                  <button
                    type="button"
                    onClick={async () => {
                      await shareImage();
                      close();
                    }}
                    disabled={busy}
                    className={itemClass}
                  >
                    <ImageIcon className="text-signal size-4 shrink-0" />
                    <span className="flex flex-col">
                      Share image
                      <span className="text-hashmark text-xs font-normal">
                        The card, with the link in the message
                      </span>
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await shareLink();
                    close();
                  }}
                  className={itemClass}
                >
                  <Share2 className="text-signal size-4 shrink-0" />
                  <span className="flex flex-col">
                    Share link
                    {/* Everyone who opens it sees the live page, not a
                        screenshot of it. */}
                    <span className="text-hashmark text-xs font-normal">
                      {canShare ? "Send the draft page" : "Copy the draft page"}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void copyLink(close)}
                  className={itemClass}
                >
                  <Link2 className="text-signal size-4 shrink-0" />
                  <span className="flex flex-col">
                    Copy link
                    <span className="text-hashmark truncate text-xs font-normal">
                      {url.replace(/^https?:\/\//, "")}
                    </span>
                  </span>
                </button>
                <a
                  href={cardUrl}
                  download={fileName}
                  onClick={close}
                  className={itemClass}
                >
                  <Download className="text-signal size-4 shrink-0" />
                  <span className="flex flex-col">
                    Download image
                    <span className="text-hashmark text-xs font-normal">
                      PNG, 1080x1350
                    </span>
                  </span>
                </a>
              </div>
            </div>
          )}
        </Popover>

        <a
          href={cardUrl}
          download={fileName}
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
      {/*
        Deliberately here rather than in the header: the league that just drew
        its order in the summer is the same league that needs a punishment
        wheel in December, and this page is the link they keep. The two
        products share a season, in opposite halves of it.
      */}
      <div className="border-sideline/50 mt-6 border-t pt-5">
        <p className="text-hashmark text-sm">
          Settle last place the same way.{" "}
          <Link
            href="/fantasy-football-punishments"
            className="text-chalk hover:text-signal font-semibold underline underline-offset-2"
          >
            Build a punishment wheel
          </Link>{" "}
          for the end of the season, drawn publicly so nobody can say the
          commissioner went easy on their friend.
        </p>
      </div>
    </section>
  );
}
