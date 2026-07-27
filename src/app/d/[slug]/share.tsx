"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { env } from "@/lib/env";
import { Popover } from "@/components/popover";
import {
  ArrowRight,
  CalendarPlus,
  Check,
  Copy,
  Download,
  ImageIcon,
  Link2,
  RefreshCw,
  Share2,
  Trophy,
} from "lucide-react";

/**
 * The sharing surfaces on a draft page.
 *
 * Everything here exists to turn viewers into creators, and the page has two
 * moments worth spending on. Before the draw, the link itself is the product:
 * the whole trust argument is that the league saw this URL before draw time, so
 * getting it into the group chat is the only job. After it, the result puts the
 * whole league on one page at the same second, which is the only moment this
 * product ever gets that attention.
 *
 * Both moments share one popover (ShareMenu) so the fork behaves identically in
 * each: the image is what lands in iMessage and carries the whole thing with
 * it, the link is what actually brings the next league here.
 *
 * None of it writes to the database. A draft is immutable and account-free, and
 * anything here that touched the server would be the first crack in that.
 */

type Team = { id: string; name: string; ownerName: string | null };

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
 * The card URL for this draft, in the reader's time zone once it is known.
 *
 * Without `?tz=` the worker has no zone and stamps the card in UTC, which is
 * never the time the league agreed to meet at.
 */
function useCardUrl(slug: string, tz: string | null) {
  return useMemo(
    () => `/d/${slug}/card${tz ? `?tz=${encodeURIComponent(tz)}` : ""}`,
    [slug, tz],
  );
}

const menuItemClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-chalk transition-colors hover:bg-sideline/60 focus-visible:bg-sideline/60 disabled:opacity-60";

/**
 * The share fork, used before and after the draw.
 *
 * The one button hides a real choice, so it opens a popover instead of
 * guessing: the image and the link travel very differently. The PNG is what
 * lands in iMessage or a story and it carries the whole thing with it, but it
 * is a dead end; the link is what actually brings the next league here. Sharing
 * the image with the URL in the message text is the best of both, so that is
 * what the first row does, and the rest are there for when it is not what
 * somebody wants.
 */
function ShareMenu({
  triggerLabel,
  cardUrl,
  cardAlt,
  fileName,
  url,
  shareTitle,
  shareText,
  linkHint,
  tone = "primary",
}: {
  triggerLabel: string;
  cardUrl: string;
  cardAlt: string;
  fileName: string;
  url: string;
  shareTitle: string;
  shareText: string;
  /** What "Share link" sends, in the reader's terms. */
  linkHint: string;
  /**
   * Before the draw the green belongs to the copy button beside the URL field,
   * which is the action that panel exists for; a second filled button next to
   * it just splits the instruction in half.
   */
  tone?: "primary" | "secondary";
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const { canShare } = useClientCapabilities();

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
        await navigator.share({ title: shareTitle, text: shareText, url });
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

  return (
    <Popover
      label="Share options"
      triggerClassName={`inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold transition-colors sm:w-auto ${
        tone === "primary"
          ? "bg-signal text-midnight hover:bg-signal-dark"
          : "border-sideline/60 bg-midnight/50 text-chalk hover:border-signal/40 border"
      }`}
      trigger={
        copied ? (
          <>
            <Check className="size-4" />
            Copied
          </>
        ) : (
          <>
            <Share2 className="size-4" />
            {triggerLabel}
          </>
        )
      }
    >
      {(close) => (
        <div className="space-y-3">
          {/* The card is the point, so show the actual card. It is the same URL
              the buttons below use, so this costs one render that is then
              served from cache. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cardUrl}
            alt={cardAlt}
            className="border-sideline/60 bg-midnight w-full rounded-xl border"
          />

          <div className="space-y-0.5">
            {canShare && (
              <button
                type="button"
                onClick={async () => {
                  await shareImage();
                  close();
                }}
                disabled={busy}
                className={menuItemClass}
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
              className={menuItemClass}
            >
              <Share2 className="text-signal size-4 shrink-0" />
              <span className="flex flex-col">
                Share link
                <span className="text-hashmark text-xs font-normal">
                  {linkHint}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => void copyLink(close)}
              className={menuItemClass}
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
              className={menuItemClass}
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
  );
}

/**
 * The pre-draw panel: get this link into the league chat before draw time.
 *
 * The raw URL stays visible in a field rather than hiding behind a button. This
 * is the one string the whole trust argument rests on, and somebody about to
 * paste it into a group chat should be able to read it, select it, and see that
 * it is the same link they will be asked about afterwards.
 */
export function PreDrawShare({
  slug,
  leagueName,
  scheduledFor,
}: {
  slug: string;
  leagueName: string;
  scheduledFor: string;
}) {
  // The canonical origin rather than window.location.origin. This is the one
  // string in the app that has to be right: the whole promise is that the
  // league saw THIS link before the draw, so it must not vary with whichever
  // host the commissioner happened to open (workers.dev, www, localhost).
  // It also means no post-hydration swap of a URL somebody may already be
  // copying.
  const url = `${env.NEXT_PUBLIC_BASE_URL}/d/${slug}`;
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { tz } = useClientCapabilities();
  const cardUrl = useCardUrl(slug, tz);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      inputRef.current?.select();
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  // Only ever read inside an event handler or the popover, both of which run
  // after mount, so the browser locale here can never disagree with the HTML.
  const when = new Date(scheduledFor).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const shareText = `${leagueName} draft order gets drawn live at ${when}.\n\nThe order is scheduled now and drawn later from open-source code, so nobody — including whoever set it up — can touch the result. Save this link and watch it happen:`;

  return (
    <section className="border-signal/30 bg-signal/5 rounded-2xl border p-3.5 sm:p-5">
      <div className="flex items-center gap-2">
        <p className="text-signal font-mono text-[11px] font-medium tracking-wider uppercase sm:text-xs">
          Share this link with your league prior to the draft time
        </p>
      </div>
      <div className="mt-2.5 flex flex-col gap-2 sm:mt-3 sm:flex-row sm:items-stretch">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          onClick={(e) => e.currentTarget.select()}
          className="border-sideline/60 bg-midnight/70 text-chalk focus:border-signal/60 focus:ring-signal/30 min-w-0 flex-1 rounded-xl border px-3.5 py-2.5 font-mono text-sm transition-colors outline-none focus:ring-2"
          aria-label="Shareable draft link"
        />
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Link copied" : "Copy link"}
          className={`relative inline-flex h-11 shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-xl px-5 text-sm font-semibold transition-colors sm:w-32 ${
            copied
              ? "bg-signal/20 text-signal ring-signal/40 ring-1"
              : "bg-signal text-midnight hover:bg-signal-dark"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.9 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="inline-flex items-center gap-1.5"
              >
                <Check className="size-4" />
                Copied
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.9 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="inline-flex items-center gap-1.5"
              >
                <Copy className="size-4" />
                Copy link
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      {/* The field above is for a paste into a chat somebody already has open.
          This row is for a phone, where the share sheet is the whole workflow
          and the card is what makes the message worth opening. */}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <ShareMenu
          triggerLabel="Share the draw"
          cardUrl={cardUrl}
          cardAlt={`${leagueName} draft, scheduled`}
          fileName={`${slug}-draft.png`}
          url={url}
          shareTitle={`${leagueName} draft order draw`}
          shareText={shareText}
          linkHint="Send the draft page, before the draw"
          tone="secondary"
        />
        <AddToCalendarButton slug={slug} />
      </div>
    </section>
  );
}

/**
 * The results share panel: the artifact people actually post.
 */
export function ResultShare({
  slug,
  leagueName,
  teams,
  picks,
}: {
  slug: string;
  leagueName: string;
  teams: Team[];
  picks: { teamId: string; pickNumber: number }[];
}) {
  const { tz } = useClientCapabilities();
  const cardUrl = useCardUrl(slug, tz);

  // The canonical origin, not window.location.origin: this URL is about to be
  // pasted somewhere permanent, and it should say fantasyfootballdraftorder.com
  // even when the page was opened on the workers.dev fallback host.
  const url = `${env.NEXT_PUBLIC_BASE_URL}/d/${slug}`;
  const fileName = `${slug}-draft-order.png`;

  const shareText = `${leagueName} draft order, drawn live from open-source code:\n\n${picks
    .slice()
    .sort((a, b) => a.pickNumber - b.pickNumber)
    .slice(0, 3)
    .map(
      (p) =>
        `${p.pickNumber}${ordinalSuffix(p.pickNumber)} ${
          teams.find((t) => t.id === p.teamId)?.name ?? ""
        }`,
    )
    .join("\n")}\n`;

  return (
    <section className="border-signal/30 bg-signal/5 space-y-4 rounded-2xl border p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Trophy className="text-signal size-4 shrink-0" />
        <p className="text-signal font-mono text-[11px] font-medium tracking-wider uppercase sm:text-xs">
          Share the result
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <ShareMenu
          triggerLabel="Share the order"
          cardUrl={cardUrl}
          cardAlt={`${leagueName} draft order`}
          fileName={fileName}
          url={url}
          shareTitle={`${leagueName} draft order`}
          shareText={shareText}
          linkHint="Send the draft page"
        />

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
 * "Run this for your other league."
 *
 * After the draw this fires at the emotional peak: the last pick has landed and
 * every manager is still looking at the page. Before it, the same ask is worth
 * making early for a different reason — the person reading a countdown is
 * usually the commissioner who just created this, and they are the one who runs
 * two other leagues.
 *
 * The re-run branch ("keeper order", "waiver order") only exists after the
 * draw: offering to re-draw a league whose first draw has not happened yet
 * reads as an invitation to shop for a result, which is the exact thing this
 * product exists to make impossible.
 */
export function AnotherLeagueCta({
  slug,
  leagueName,
  variant,
}: {
  slug: string;
  leagueName: string;
  variant: "pre-draw" | "after-draw";
}) {
  const isPreDraw = variant === "pre-draw";
  return (
    <section
      className={`border-sideline/50 bg-sideline/20 rounded-2xl border ${
        isPreDraw ? "p-5 sm:p-6" : "p-6 sm:p-8"
      }`}
    >
      <h3
        className={`font-display text-chalk font-bold tracking-tight ${
          isPreDraw ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
        }`}
      >
        In another league?
      </h3>
      <p className="text-hashmark mt-2 max-w-xl text-sm leading-relaxed">
        Somebody in that one is still setting the draft order by themselves, in
        private, and asking everyone to take their word for it. This takes about
        a minute and nobody has to take anyone&apos;s word for anything.
      </p>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <Link
          href={`/new?from=${slug}&src=${isPreDraw ? "PRE_DRAW" : "AFTER_DRAW"}`}
          className="bg-signal text-midnight hover:bg-signal-dark shadow-signal/20 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold shadow-lg transition-colors"
        >
          Set one up for your other league
          <ArrowRight className="size-4" />
        </Link>
        {!isPreDraw && (
          <Link
            href={`/new?from=${slug}&src=AFTER_DRAW_RERUN&clone=${slug}`}
            className="border-sideline/60 bg-midnight/50 text-chalk hover:border-signal/40 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border px-5 text-sm font-semibold transition-colors"
          >
            <RefreshCw className="size-4" />
            Draw again for {leagueName}
          </Link>
        )}
      </div>
      {!isPreDraw && (
        <p className="text-hashmark/70 mt-3 text-xs">
          Re-drawing creates a separate draft with its own link and its own
          seed. This one is permanent and cannot be changed.
        </p>
      )}
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
