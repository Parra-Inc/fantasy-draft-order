"use client";

import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  Calendar,
  Check,
  History,
  Loader2,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import { ViewerCount } from "./presence";
import { AnotherLeagueCta, PreDrawShare, ResultShare } from "./share";
import { PromoShelf } from "@/components/promo-shelf";

type Team = {
  id: string;
  name: string;
  ownerName: string | null;
  avatarUrl: string | null;
  position: number;
};

type Pick = { teamId: string; pickNumber: number; revealedAt: string };

type Sibling = {
  slug: string;
  leagueName: string;
  scheduledFor: string;
  createdAt: string;
  status: "SCHEDULED" | "DRAWING" | "COMPLETED";
};

type CurrentSpin = {
  teamId: string;
  pickNumber: number;
  revealedAt: string;
  spinStartAt: string;
};

type DraftState = {
  slug: string;
  leagueName: string;
  creatorName: string;
  scheduledFor: string;
  status: "SCHEDULED" | "DRAWING" | "COMPLETED";
  importSource: "SLEEPER" | "MFL" | "FLEAFLICKER" | "ESPN" | "MANUAL" | null;
  importLeagueId: string | null;
  seed: string | null;
  commitSha: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  teams: Team[];
  picks: Pick[];
  currentSpin: CurrentSpin | null;
  spinDurationMs: number;
  nextPickAt: string | null;
  serverTime: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function DraftLive({
  slug,
  initial,
  siblings,
}: {
  slug: string;
  initial: DraftState;
  siblings: Sibling[];
}) {
  const scheduledAt = new Date(initial.scheduledFor).getTime();
  // Seed from the server clock that produced this HTML, not `Date.now()`: the
  // browser hydrates seconds after the render, so a client-seeded countdown is
  // guaranteed to disagree with the markup. `initial.serverTime` is part of the
  // payload, so the first client render is byte-identical to the server's. Only
  // after mount do we switch to the local clock and start ticking.
  const [now, setNow] = useState(() => new Date(initial.serverTime).getTime());

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const pastScheduled = now >= scheduledAt;

  const { data, mutate } = useSWR<DraftState>(
    `/api/drafts/${slug}/state`,
    fetcher,
    {
      fallbackData: initial,
      revalidateOnFocus: true,
    },
  );

  const isDone = data?.status === "COMPLETED" && !data?.nextPickAt;

  useEffect(() => {
    if (isDone) return;
    const intervalMs = pastScheduled ? 500 : 1500;
    const id = setInterval(() => {
      void mutate();
    }, intervalMs);
    return () => clearInterval(id);
  }, [pastScheduled, mutate, isDone]);

  const state = data ?? initial;
  const isPreDraw = now < scheduledAt;

  const crossedRef = useRef(false);
  useEffect(() => {
    if (!crossedRef.current && pastScheduled && state.status === "SCHEDULED") {
      crossedRef.current = true;
      mutate();
    }
  }, [pastScheduled, state.status, mutate]);

  return (
    /*
      Two shapes, one DOM order. Below `lg` this is a single column and the
      shelf sits between the draw and the trust narrative. At `lg` and up the
      shelf becomes a sticky right rail spanning both content rows, so the
      trust narrative (pre-share warning, sibling drafts, audit trail) stays
      contiguous under the draw instead of being pushed down by it.

      The shelf renders in every state, including DRAWING. It is deliberately
      the quietest thing on the page (see PromoShelf), and pulling it mid-draw
      would both reflow the whole layout at the exact second everyone is
      watching and hide it during the only minute this page has an audience.
    */
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-x-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
        {isPreDraw ? (
          <PreDrawShare
            slug={slug}
            leagueName={state.leagueName}
            scheduledFor={state.scheduledFor}
          />
        ) : (
          <DrawStartedNotice scheduledFor={state.scheduledFor} />
        )}
        <Header state={state} now={now} scheduledAt={scheduledAt} slug={slug} />
        {/* The last pick has landed and the whole league is still on the page.
            This is the only moment the product has their attention, so the share
            artifact goes directly under the result headline, above the full
            order. Below it, a twelve-team list plus an audit trail is a screen
            and a half of scrolling, and the share panel was losing that race. */}
        {isDone && (
          <ResultShare
            slug={slug}
            leagueName={state.leagueName}
            teams={state.teams}
            picks={state.picks}
          />
        )}
        {/* Pre-draw the same ask goes above the roster instead of below it. The
            person watching a countdown days out is usually the commissioner who
            just created this, and a locked team list is not what they came back
            to read — after the draw the order is, which is why the results
            branch stays underneath it. */}
        {isPreDraw && (
          <AnotherLeagueCta
            slug={slug}
            leagueName={state.leagueName}
            variant="pre-draw"
          />
        )}
        {!state.currentSpin &&
        state.picks.length === 0 &&
        state.status !== "COMPLETED" ? (
          <TeamsGrid teams={state.teams} />
        ) : (
          <DrawBoard state={state} />
        )}
        {/* The "run this for your other league" ask stays after the order: it
            is the exit, not the payoff, and it should follow the thing people
            came to read rather than interrupt it. */}
        {isDone && (
          <AnotherLeagueCta
            slug={slug}
            leagueName={state.leagueName}
            variant="after-draw"
          />
        )}
      </div>

      {/* `self-start` is what makes the sticky work: a stretched grid item is
          already as tall as its area and has nowhere to travel. */}
      <aside className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <PromoShelf
          surface={state.status === "COMPLETED" ? "results" : "pre-draw"}
        />
      </aside>

      <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-2">
        {isPreDraw && <PreShareWarning />}
        <SiblingDrafts siblings={siblings} leagueName={state.leagueName} />
        <TrustPanel state={state} />
      </div>
    </div>
  );
}

function DrawStartedNotice({ scheduledFor }: { scheduledFor: string }) {
  const when = new Date(scheduledFor).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return (
    <section className="border-signal/30 bg-signal/5 overflow-hidden rounded-2xl border">
      <div className="border-sideline/40 border-b px-3.5 py-2.5 sm:px-5 sm:py-3">
        <p className="text-signal font-mono text-[11px] font-medium tracking-wider uppercase sm:text-xs">
          Was this link in your league chat before
        </p>
        <p className="font-display text-chalk mt-0.5 text-sm font-bold tabular-nums sm:text-base">
          {when}?
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="border-sideline/40 flex items-start gap-2.5 border-b p-3.5 sm:gap-3 sm:border-r sm:border-b-0 sm:p-5">
          <Check className="text-signal mt-0.5 size-4 shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-chalk text-[13px] leading-snug font-bold sm:text-sm">
              Yes — you&apos;re good.
            </p>
            <p className="text-hashmark mt-1 text-[11px] leading-snug sm:text-xs">
              Result is locked, audited, and tamper-proof.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-3.5 sm:gap-3 sm:p-5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
          <div className="min-w-0">
            <p className="font-display text-chalk text-[13px] leading-snug font-bold sm:text-sm">
              No or unsure? Your commish might be stacking the deck.
            </p>
            <p className="text-hashmark mt-1 text-[11px] leading-snug sm:text-xs">
              Check below for other drafts under this league name.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreShareWarning() {
  return (
    <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 sm:p-6">
      <div className="flex gap-3">
        <AlertTriangle className="size-5 shrink-0 text-amber-300" />
        <div className="text-hashmark space-y-2 text-sm">
          <p className="font-display text-sm font-bold tracking-wider text-amber-200 uppercase">
            Read this before you trust the result
          </p>
          <p>
            The draw is only fair if you saw this exact link{" "}
            <span className="text-chalk font-semibold">before</span> the draft
            time — i.e. your commissioner posted it in your group chat, email
            thread, or league chat ahead of the scheduled draw.
          </p>
          <p>
            Anyone can create a draft. A commissioner who creates several drafts
            and only shares the one they like is gaming the system. If this URL
            showed up after the draw — or if there are sibling drafts below for
            the same league name that you weren&apos;t told about — treat the
            result as suspect.
          </p>
          <p>
            <a
              href="/ask-your-commissioner"
              className="text-chalk hover:text-signal underline underline-offset-2"
            >
              How to raise this with your league without starting a fight →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

function SiblingDrafts({
  siblings,
  leagueName,
}: {
  siblings: Sibling[];
  leagueName: string;
}) {
  if (siblings.length === 0) return null;
  return (
    <section className="border-sideline/50 bg-sideline/10 rounded-2xl border p-4 sm:p-6">
      <div className="mb-3 flex items-center gap-2 sm:mb-4">
        <History className="text-signal size-4 shrink-0" />
        <h3 className="font-display text-signal text-xs font-bold tracking-wider uppercase sm:text-sm">
          Other drafts under &ldquo;{leagueName}&rdquo;
        </h3>
      </div>
      <p className="text-hashmark mb-3 text-xs sm:mb-4 sm:text-sm">
        We found {siblings.length} other{" "}
        {siblings.length === 1 ? "draft" : "drafts"} created under this league
        name. If your commissioner didn&apos;t share these with you, ask why
        they exist before trusting any single result.
      </p>
      <ol className="border-sideline/30 overflow-hidden rounded-xl border">
        {siblings.map((s, idx) => (
          <li
            key={s.slug}
            className={`bg-midnight/40 flex flex-col gap-1.5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 ${
              idx !== 0 ? "border-sideline/30 border-t" : ""
            }`}
          >
            <div className="min-w-0">
              <a
                href={`/d/${s.slug}`}
                className="text-chalk hover:text-signal block truncate font-mono text-xs underline underline-offset-2 sm:text-sm"
              >
                /d/{s.slug}
              </a>
              <p className="text-hashmark mt-1 text-[11px] leading-snug sm:text-xs">
                Created {new Date(s.createdAt).toLocaleString()}
                <span className="hidden sm:inline">
                  {" "}
                  · scheduled {new Date(s.scheduledFor).toLocaleString()}
                </span>
              </p>
              <p className="text-hashmark mt-0.5 text-[11px] leading-snug sm:hidden">
                Scheduled {new Date(s.scheduledFor).toLocaleString()}
              </p>
            </div>
            <SiblingStatusPill status={s.status} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function SiblingStatusPill({ status }: { status: Sibling["status"] }) {
  const label =
    status === "COMPLETED"
      ? "Complete"
      : status === "DRAWING"
        ? "Drawing"
        : "Scheduled";
  return (
    <span className="border-sideline bg-sideline/40 text-hashmark inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider uppercase">
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: DraftState["status"] }) {
  if (status === "DRAWING") {
    return (
      <span
        className="border-signal/30 bg-signal/10 text-signal inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
        data-testid="status-pill"
        data-status="DRAWING"
      >
        <span className="relative flex size-1.5">
          <span className="bg-signal absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
          <span className="bg-signal relative inline-flex size-1.5 rounded-full" />
        </span>
        Drawing live
      </span>
    );
  }
  if (status === "COMPLETED") {
    return (
      <span
        className="border-signal/30 bg-signal/10 text-signal inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
        data-testid="status-pill"
        data-status="COMPLETED"
      >
        <Trophy className="size-3" />
        Complete
      </span>
    );
  }
  return (
    <span
      className="border-sideline bg-sideline/40 text-hashmark inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
      data-testid="status-pill"
      data-status="SCHEDULED"
    >
      <Calendar className="size-3" />
      Scheduled
    </span>
  );
}

function Header({
  state,
  now,
  scheduledAt,
  slug,
}: {
  state: DraftState;
  now: number;
  scheduledAt: number;
  slug: string;
}) {
  const remaining = Math.max(0, scheduledAt - now);

  return (
    <header className="border-sideline/50 bg-sideline/20 rounded-2xl border p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill status={state.status} />
        <ViewerCount slug={slug} />
        <span className="text-hashmark inline-flex items-center gap-1.5 text-xs font-medium">
          <Users className="size-3.5" />
          {state.teams.length} teams
        </span>
        {state.importSource && state.importSource !== "MANUAL" && (
          <span className="text-hashmark font-mono text-xs uppercase">
            · {state.importSource}
          </span>
        )}
        <span className="text-hashmark text-xs">· by {state.creatorName}</span>
      </div>
      <h1 className="font-display text-chalk mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
        {state.leagueName}
      </h1>

      {state.status === "SCHEDULED" && remaining > 0 && (
        <div className="border-signal/20 bg-midnight/60 mt-6 rounded-xl border p-5">
          <p className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
            Drawing in
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-chalk font-mono text-5xl font-bold tabular-nums sm:text-6xl">
              {formatCountdown(remaining)}
            </span>
          </div>
          <p className="text-hashmark mt-2 text-sm">
            {new Date(state.scheduledFor).toLocaleString()}
          </p>
        </div>
      )}

      {state.status === "SCHEDULED" && remaining === 0 && (
        <div className="border-signal/30 bg-midnight/60 mt-6 rounded-xl border p-5">
          <p className="text-signal flex items-center gap-2 font-mono text-xs font-medium tracking-wider uppercase">
            <span className="relative flex size-2">
              <span className="bg-signal absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-signal relative inline-flex size-2 rounded-full" />
            </span>
            Starting now
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Loader2 className="text-signal size-7 shrink-0 animate-spin sm:size-8" />
            <span className="font-display text-chalk text-3xl font-bold sm:text-4xl">
              Your draft is starting now…
            </span>
          </div>
          <p className="text-hashmark mt-2 text-sm">
            Connecting to the draw — this should only take a moment.
          </p>
        </div>
      )}

      {state.status === "DRAWING" && (
        <p className="font-display text-signal mt-4 text-xl">
          The draw is running. Watch the picks appear live…
        </p>
      )}

      {state.status === "COMPLETED" && state.completedAt && (
        <p className="text-hashmark mt-4 text-sm">
          Completed {new Date(state.completedAt).toLocaleString()}
        </p>
      )}
    </header>
  );
}

function TeamsGrid({ teams }: { teams: Team[] }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
          Teams locked in
        </h2>
        <span className="text-hashmark text-xs">
          order hidden until draw time
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {teams.map((team) => (
          <li
            key={team.id}
            className="border-sideline/50 bg-sideline/20 hover:border-signal/30 flex items-center gap-3 rounded-xl border p-3 transition-colors"
          >
            <Avatar name={team.name} url={team.avatarUrl} />
            <div className="min-w-0">
              <p className="text-chalk truncate font-semibold">{team.name}</p>
              {team.ownerName && (
                <p className="text-hashmark truncate text-xs">
                  {team.ownerName}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DrawBoard({ state }: { state: DraftState }) {
  const teamById = useMemo(
    () => new Map(state.teams.map((t) => [t.id, t])),
    [state.teams],
  );
  const pickedTeamIds = useMemo(
    () => new Set(state.picks.map((p) => p.teamId)),
    [state.picks],
  );
  const unpickedTeams = useMemo(
    () => state.teams.filter((t) => !pickedTeamIds.has(t.id)),
    [state.teams, pickedTeamIds],
  );

  const spinWinnerTeam = state.currentSpin
    ? (teamById.get(state.currentSpin.teamId) ?? null)
    : null;

  return (
    <section className="space-y-6" data-testid="draw-board">
      {state.currentSpin && spinWinnerTeam && (
        <ReelSpinner
          key={state.currentSpin.pickNumber}
          pickNumber={state.currentSpin.pickNumber}
          totalPicks={state.teams.length}
          drawnCount={state.picks.length}
          unpickedTeams={unpickedTeams}
          winnerTeamId={spinWinnerTeam.id}
          spinStartAt={state.currentSpin.spinStartAt}
          revealedAt={state.currentSpin.revealedAt}
          spinDurationMs={state.spinDurationMs}
        />
      )}
      <RevealedList
        picks={state.picks}
        teamById={teamById}
        total={state.teams.length}
        status={state.status}
      />
    </section>
  );
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

const REEL_ITEM_HEIGHT = 96;
const REEL_LOOPS = 5;

function ReelSpinner({
  pickNumber,
  totalPicks,
  drawnCount,
  unpickedTeams,
  winnerTeamId,
  spinStartAt,
  revealedAt,
  spinDurationMs,
}: {
  pickNumber: number;
  totalPicks: number;
  drawnCount: number;
  unpickedTeams: Team[];
  winnerTeamId: string;
  spinStartAt: string;
  revealedAt: string;
  spinDurationMs: number;
}) {
  const reelRef = useRef<HTMLDivElement>(null);

  const winnerIndex = useMemo(
    () =>
      Math.max(
        0,
        unpickedTeams.findIndex((t) => t.id === winnerTeamId),
      ),
    [unpickedTeams, winnerTeamId],
  );

  const repeatedTeams = useMemo(() => {
    const out: Team[] = [];
    for (let i = 0; i < REEL_LOOPS + 1; i++) out.push(...unpickedTeams);
    return out;
  }, [unpickedTeams]);

  const finalOffset =
    (REEL_LOOPS * unpickedTeams.length + winnerIndex) * REEL_ITEM_HEIGHT;

  useLayoutEffect(() => {
    const startMs = new Date(spinStartAt).getTime();
    const endMs = new Date(revealedAt).getTime();
    const total = Math.max(1, endMs - startMs);
    let raf = 0;
    const tick = () => {
      const t = Date.now();
      const elapsed = Math.max(0, t - startMs);
      const progress = Math.min(1, elapsed / total);
      const eased = easeOutCubic(progress);
      const offset = finalOffset * eased;
      if (reelRef.current) {
        reelRef.current.style.transform = `translate3d(0, ${-offset}px, 0)`;
      }
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spinStartAt, revealedAt, finalOffset]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="border-signal/30 from-signal/10 to-midnight/60 relative overflow-hidden rounded-2xl border bg-gradient-to-b p-5 sm:p-7"
      data-testid="reel-spinner"
      data-spin-pick={pickNumber}
      data-spin-duration={spinDurationMs}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,200,0.12),transparent_60%)]" />

      <div className="relative flex items-center justify-between gap-3">
        <p className="text-signal flex items-center gap-2 font-mono text-[11px] font-medium tracking-wider uppercase sm:text-xs">
          <span className="relative flex size-2">
            <span className="bg-signal absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
            <span className="bg-signal relative inline-flex size-2 rounded-full" />
          </span>
          Drafting pick {pickNumber} of {totalPicks}
        </p>
        <span className="text-hashmark font-mono text-[11px] sm:text-xs">
          {drawnCount} / {totalPicks} drawn
        </span>
      </div>

      <div className="relative mt-5">
        <div
          className="border-sideline/60 bg-midnight/70 relative mx-auto overflow-hidden rounded-xl border"
          style={{ height: REEL_ITEM_HEIGHT }}
        >
          <div
            ref={reelRef}
            className="will-change-transform"
            style={{ transform: "translate3d(0, 0, 0)" }}
          >
            {repeatedTeams.map((team, idx) => (
              <div
                key={`${team.id}-${idx}`}
                className="flex items-center gap-4 px-4 sm:px-6"
                style={{ height: REEL_ITEM_HEIGHT }}
              >
                <Avatar name={team.name} url={team.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-chalk truncate text-lg font-bold sm:text-xl">
                    {team.name}
                  </p>
                  {team.ownerName && (
                    <p className="text-hashmark truncate text-xs">
                      {team.ownerName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="from-midnight pointer-events-none absolute inset-x-0 top-0 h-3 bg-gradient-to-b to-transparent" />
          <div className="from-midnight pointer-events-none absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t to-transparent" />
          <div className="ring-signal/40 pointer-events-none absolute inset-0 rounded-xl ring-2 ring-inset" />
        </div>
      </div>
    </motion.div>
  );
}

function RevealedList({
  picks,
  teamById,
  total,
  status,
}: {
  picks: Pick[];
  teamById: Map<string, Team>;
  total: number;
  status: DraftState["status"];
}) {
  if (picks.length === 0) {
    return null;
  }
  const ordered = [...picks].sort((a, b) => a.pickNumber - b.pickNumber);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
          {status === "COMPLETED" ? "Final draft order" : "Drawn so far"}
        </h2>
        <span className="text-hashmark text-xs">
          {picks.length} / {total} revealed
        </span>
      </div>
      <ol
        className="border-sideline/50 bg-sideline/10 overflow-hidden rounded-2xl border"
        data-testid="revealed-list"
        data-count={picks.length}
      >
        {ordered.map((pick, idx) => {
          const team = teamById.get(pick.teamId);
          if (!team) return null;
          return (
            <motion.li
              key={pick.pickNumber}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`bg-midnight/40 flex items-center gap-4 px-4 py-3 sm:px-6 ${
                idx !== 0 ? "border-sideline/30 border-t" : ""
              }`}
            >
              <div className="bg-signal/15 text-signal ring-signal/30 flex size-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold tabular-nums ring-1">
                {pick.pickNumber}
              </div>
              <Avatar name={team.name} url={team.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="text-chalk truncate font-semibold">{team.name}</p>
                {team.ownerName && (
                  <p className="text-hashmark truncate text-xs">
                    {team.ownerName}
                  </p>
                )}
              </div>
              <span className="text-hashmark/60 hidden font-mono text-[10px] sm:inline">
                pck_{pick.pickNumber.toString().padStart(3, "0")}
              </span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

function BigAvatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        className="ring-signal/40 size-full rounded-full object-cover ring-2"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="bg-signal/15 font-display text-signal ring-signal/40 flex size-full items-center justify-center rounded-full text-3xl font-bold ring-2 sm:text-4xl">
      {initials}
    </div>
  );
}

function TrustPanel({ state }: { state: DraftState }) {
  if (state.status === "SCHEDULED") {
    return (
      <section className="border-sideline/50 bg-sideline/10 rounded-2xl border p-6">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="text-signal size-4" />
          <h3 className="font-display text-signal text-sm font-bold tracking-wider uppercase">
            How this draft works
          </h3>
        </div>
        <ul className="text-hashmark space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-signal">·</span>
            The draw fires automatically at the scheduled time. No one can run
            it early or twice.
          </li>
          <li className="flex gap-2">
            <span className="text-signal">·</span>
            The randomizer is a Fisher–Yates shuffle using Node&apos;s{" "}
            <code className="bg-midnight text-chalk rounded px-1.5 py-0.5 font-mono text-xs">
              crypto.randomInt
            </code>{" "}
            (CSPRNG).
          </li>
          <li className="flex gap-2">
            <span className="text-signal">·</span>
            Teams above are locked in — they cannot be edited.
          </li>
          <li className="flex gap-2">
            <span className="text-signal">·</span>
            The result is only trustworthy if you got this link{" "}
            <span className="text-chalk font-semibold">before</span> the draw
            time. See the warning below.
          </li>
          <li className="flex gap-2">
            <span className="text-signal">·</span>
            <a
              href="https://github.com/Parra-Inc/fantasy-draft-order"
              target="_blank"
              rel="noreferrer"
              className="text-chalk hover:text-signal underline underline-offset-2"
            >
              Source code is public.
            </a>
          </li>
        </ul>
      </section>
    );
  }
  const commitUrl = state.commitSha
    ? `https://github.com/Parra-Inc/fantasy-draft-order/blob/${state.commitSha}/src/lib/randomizer.ts`
    : "https://github.com/Parra-Inc/fantasy-draft-order/blob/main/src/lib/randomizer.ts";
  return (
    <section className="border-sideline/50 bg-sideline/10 rounded-2xl border p-6">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="text-signal size-4" />
        <h3 className="font-display text-signal text-sm font-bold tracking-wider uppercase">
          Audit trail
        </h3>
      </div>
      <dl className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-[180px_1fr]">
        <AuditRow label="Method">
          Fisher–Yates shuffle ·{" "}
          <code className="bg-midnight text-chalk rounded px-1.5 py-0.5 font-mono text-xs">
            crypto.randomInt
          </code>
        </AuditRow>
        <AuditRow label="Source">
          <a
            href={commitUrl}
            target="_blank"
            rel="noreferrer"
            className="text-chalk hover:text-signal font-mono text-xs underline underline-offset-2"
          >
            randomizer.ts
            {state.commitSha ? `@${state.commitSha.slice(0, 7)}` : ""}
          </a>
        </AuditRow>
        {state.seed && (
          <AuditRow label="Seed">
            <span className="text-chalk font-mono text-xs break-all">
              {state.seed}
            </span>
          </AuditRow>
        )}
        <AuditRow label="Scheduled">
          {new Date(state.scheduledFor).toLocaleString()}
        </AuditRow>
        {state.startedAt && (
          <AuditRow label="Started">
            {new Date(state.startedAt).toLocaleString()}
          </AuditRow>
        )}
        {state.completedAt && (
          <AuditRow label="Completed">
            {new Date(state.completedAt).toLocaleString()}
          </AuditRow>
        )}
      </dl>
    </section>
  );
}

function AuditRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-hashmark font-mono text-xs tracking-wider uppercase">
        {label}
      </dt>
      <dd className="text-chalk">{children}</dd>
    </>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        className="ring-sideline size-9 shrink-0 rounded-full object-cover ring-1"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="bg-signal/15 text-signal ring-signal/30 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1">
      {initials}
    </div>
  );
}

function formatCountdown(ms: number) {
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
