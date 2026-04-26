"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { AlertTriangle, Calendar, Check, Copy, History, Loader2, Shield, Trophy, Users } from "lucide-react";

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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const pastScheduled = now >= scheduledAt;
  const refreshInterval = pastScheduled
    ? 1000
    : now + 60_000 >= scheduledAt
      ? 1500
      : 4000;

  const { data, mutate } = useSWR<DraftState>(
    `/api/drafts/${slug}/state`,
    fetcher,
    {
      fallbackData: initial,
      refreshInterval: (latest) =>
        latest?.status === "COMPLETED" && !latest.nextPickAt ? 0 : refreshInterval,
      revalidateOnFocus: true,
    },
  );

  const state = data ?? initial;

  const crossedRef = useRef(false);
  useEffect(() => {
    if (!crossedRef.current && pastScheduled && state.status === "SCHEDULED") {
      crossedRef.current = true;
      mutate();
    }
  }, [pastScheduled, state.status, mutate]);

  return (
    <div className="space-y-6">
      {now < scheduledAt && <ShareCard slug={slug} />}
      <Header state={state} now={now} scheduledAt={scheduledAt} />
      {state.status === "SCHEDULED" ? (
        <TeamsGrid teams={state.teams} />
      ) : (
        <DrawBoard state={state} />
      )}
      <PreShareWarning />
      <SiblingDrafts siblings={siblings} leagueName={state.leagueName} />
      <TrustPanel state={state} />
    </div>
  );
}

function PreShareWarning() {
  return (
    <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 sm:p-6">
      <div className="flex gap-3">
        <AlertTriangle className="size-5 shrink-0 text-amber-300" />
        <div className="space-y-2 text-sm text-hashmark">
          <p className="font-display text-sm font-bold uppercase tracking-wider text-amber-200">
            Read this before you trust the result
          </p>
          <p>
            The draw is only fair if you saw this exact link{" "}
            <span className="font-semibold text-chalk">before</span> the draft time —
            i.e. your commissioner posted it in your group chat, email thread, or
            league chat ahead of the scheduled draw.
          </p>
          <p>
            Anyone can create a draft. A commissioner who creates several drafts
            and only shares the one they like is gaming the system. If this URL
            showed up after the draw — or if there are sibling drafts below for
            the same league name that you weren&apos;t told about — treat the
            result as suspect.
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
    <section className="rounded-2xl border border-sideline/50 bg-sideline/10 p-6">
      <div className="mb-4 flex items-center gap-2">
        <History className="size-4 text-signal" />
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-signal">
          Other drafts under &ldquo;{leagueName}&rdquo;
        </h3>
      </div>
      <p className="mb-4 text-sm text-hashmark">
        We found {siblings.length} other{" "}
        {siblings.length === 1 ? "draft" : "drafts"} created under this league
        name. If your commissioner didn&apos;t share these with you, ask why
        they exist before trusting any single result.
      </p>
      <ol className="overflow-hidden rounded-xl border border-sideline/30">
        {siblings.map((s, idx) => (
          <li
            key={s.slug}
            className={`flex flex-col gap-2 bg-midnight/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
              idx !== 0 ? "border-t border-sideline/30" : ""
            }`}
          >
            <div className="min-w-0">
              <a
                href={`/d/${s.slug}`}
                className="font-mono text-sm text-chalk underline underline-offset-2 hover:text-signal"
              >
                /d/{s.slug}
              </a>
              <p className="mt-1 text-xs text-hashmark">
                Created {new Date(s.createdAt).toLocaleString()} · scheduled{" "}
                {new Date(s.scheduledFor).toLocaleString()}
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
    <span className="inline-flex shrink-0 items-center rounded-full border border-sideline bg-sideline/40 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-hashmark">
      {label}
    </span>
  );
}

function ShareCard({ slug }: { slug: string }) {
  const [url, setUrl] = useState(`/d/${slug}`);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrl(`${window.location.origin}/d/${slug}`);
  }, [slug]);

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

  return (
    <section className="rounded-2xl border border-signal/30 bg-signal/5 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <p className="font-mono text-xs font-medium uppercase tracking-wider text-signal">
          Share this link with your league prior to the draft time
        </p>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          onClick={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-xl border border-sideline/60 bg-midnight/70 px-3.5 py-2.5 font-mono text-sm text-chalk outline-none transition-colors focus:border-signal/60 focus:ring-2 focus:ring-signal/30"
          aria-label="Shareable draft link"
        />
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Link copied" : "Copy link"}
          className={`relative inline-flex h-11 shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-xl px-5 text-sm font-semibold transition-colors sm:w-32 ${
            copied
              ? "bg-signal/20 text-signal ring-1 ring-signal/40"
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
    </section>
  );
}

function StatusPill({
  status,
}: {
  status: DraftState["status"];
}) {
  if (status === "DRAWING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs font-semibold text-signal">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
        </span>
        Drawing live
      </span>
    );
  }
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs font-semibold text-signal">
        <Trophy className="size-3" />
        Complete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sideline bg-sideline/40 px-3 py-1 text-xs font-semibold text-hashmark">
      <Calendar className="size-3" />
      Scheduled
    </span>
  );
}

function Header({
  state,
  now,
  scheduledAt,
}: {
  state: DraftState;
  now: number;
  scheduledAt: number;
}) {
  const remaining = Math.max(0, scheduledAt - now);

  return (
    <header className="rounded-2xl border border-sideline/50 bg-sideline/20 p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill status={state.status} />
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-hashmark">
          <Users className="size-3.5" />
          {state.teams.length} teams
        </span>
        {state.importSource && state.importSource !== "MANUAL" && (
          <span className="font-mono text-xs uppercase text-hashmark">
            · {state.importSource}
          </span>
        )}
        <span className="text-xs text-hashmark">· by {state.creatorName}</span>
      </div>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-chalk sm:text-5xl">
        {state.leagueName}
      </h1>

      {state.status === "SCHEDULED" && remaining > 0 && (
        <div className="mt-6 rounded-xl border border-signal/20 bg-midnight/60 p-5">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-signal">
            Drawing in
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-mono text-5xl font-bold tabular-nums text-chalk sm:text-6xl">
              {formatCountdown(remaining)}
            </span>
          </div>
          <p className="mt-2 text-sm text-hashmark">
            {new Date(state.scheduledFor).toLocaleString()}
          </p>
        </div>
      )}

      {state.status === "SCHEDULED" && remaining === 0 && (
        <div className="mt-6 rounded-xl border border-signal/30 bg-midnight/60 p-5">
          <p className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-wider text-signal">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-signal" />
            </span>
            Starting now
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Loader2 className="size-7 shrink-0 animate-spin text-signal sm:size-8" />
            <span className="font-display text-3xl font-bold text-chalk sm:text-4xl">
              Your draft is starting now…
            </span>
          </div>
          <p className="mt-2 text-sm text-hashmark">
            Connecting to the draw — this should only take a moment.
          </p>
        </div>
      )}

      {state.status === "DRAWING" && (
        <p className="mt-4 font-display text-xl text-signal">
          The draw is running. Watch the picks appear live…
        </p>
      )}

      {state.status === "COMPLETED" && state.completedAt && (
        <p className="mt-4 text-sm text-hashmark">
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
        <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-signal">
          Teams locked in
        </h2>
        <span className="text-xs text-hashmark">
          order hidden until draw time
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {teams.map((team) => (
          <li
            key={team.id}
            className="flex items-center gap-3 rounded-xl border border-sideline/50 bg-sideline/20 p-3 transition-colors hover:border-signal/30"
          >
            <Avatar name={team.name} url={team.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-chalk">{team.name}</p>
              {team.ownerName && (
                <p className="truncate text-xs text-hashmark">{team.ownerName}</p>
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
  const nextPickNumber = state.picks.length + 1;
  const drafting =
    state.status === "DRAWING" && nextPickNumber <= state.teams.length;

  return (
    <section className="space-y-6">
      {drafting && (
        <SpinnerCard
          key={nextPickNumber}
          pickNumber={nextPickNumber}
          totalPicks={state.teams.length}
          unpickedTeams={unpickedTeams}
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

function SpinnerCard({
  pickNumber,
  totalPicks,
  unpickedTeams,
}: {
  pickNumber: number;
  totalPicks: number;
  unpickedTeams: Team[];
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (unpickedTeams.length === 0) return;
    const id = setInterval(() => setTick((t) => t + 1), 90);
    return () => clearInterval(id);
  }, [unpickedTeams.length]);

  const spinning = unpickedTeams[tick % Math.max(unpickedTeams.length, 1)] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-signal/30 bg-gradient-to-b from-signal/10 to-midnight/60 p-6 sm:p-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,200,0.12),transparent_60%)]" />
      <div className="relative flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-wider text-signal">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-signal" />
          </span>
          Drafting pick {pickNumber} of {totalPicks}
        </p>
        <span className="font-mono text-xs text-hashmark">
          {totalPicks - unpickedTeams.length} / {totalPicks} drawn
        </span>
      </div>

      <div className="relative mt-6 flex flex-col items-center gap-5">
        <div className="relative flex size-32 items-center justify-center sm:size-40">
          <span className="absolute inset-0 rounded-full border-2 border-signal/20" />
          <span
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-signal animate-spin"
            style={{ animationDuration: "0.9s" }}
          />
          {spinning && (
            <AnimatePresence mode="popLayout">
              <motion.div
                key={spinning.id + tick}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.12 }}
                className="absolute inset-3 flex items-center justify-center sm:inset-4"
              >
                <BigAvatar name={spinning.name} url={spinning.avatarUrl} />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
        {spinning && (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={spinning.id + "-name-" + tick}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="text-center"
            >
              <p className="font-display text-2xl font-bold text-chalk sm:text-3xl">
                {spinning.name}
              </p>
              {spinning.ownerName && (
                <p className="mt-1 text-sm text-hashmark">{spinning.ownerName}</p>
              )}
            </motion.div>
          </AnimatePresence>
        )}
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
        <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-signal">
          {status === "COMPLETED" ? "Final draft order" : "Drawn so far"}
        </h2>
        <span className="text-xs text-hashmark">
          {picks.length} / {total} revealed
        </span>
      </div>
      <ol className="overflow-hidden rounded-2xl border border-sideline/50 bg-sideline/10">
        {ordered.map((pick, idx) => {
          const team = teamById.get(pick.teamId);
          if (!team) return null;
          return (
            <motion.li
              key={pick.pickNumber}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-4 bg-midnight/40 px-4 py-3 sm:px-6 ${
                idx !== 0 ? "border-t border-sideline/30" : ""
              }`}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-signal/15 font-mono text-sm font-bold tabular-nums text-signal ring-1 ring-signal/30">
                {pick.pickNumber}
              </div>
              <Avatar name={team.name} url={team.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-chalk">{team.name}</p>
                {team.ownerName && (
                  <p className="truncate text-xs text-hashmark">{team.ownerName}</p>
                )}
              </div>
              <span className="hidden font-mono text-[10px] text-hashmark/60 sm:inline">
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
        className="size-full rounded-full object-cover ring-2 ring-signal/40"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="flex size-full items-center justify-center rounded-full bg-signal/15 font-display text-3xl font-bold text-signal ring-2 ring-signal/40 sm:text-4xl">
      {initials}
    </div>
  );
}

function TrustPanel({ state }: { state: DraftState }) {
  if (state.status === "SCHEDULED") {
    return (
      <section className="rounded-2xl border border-sideline/50 bg-sideline/10 p-6">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="size-4 text-signal" />
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-signal">
            How this draft works
          </h3>
        </div>
        <ul className="space-y-2 text-sm text-hashmark">
          <li className="flex gap-2">
            <span className="text-signal">·</span>
            The draw fires automatically at the scheduled time. No one can run it early or twice.
          </li>
          <li className="flex gap-2">
            <span className="text-signal">·</span>
            The randomizer is a Fisher–Yates shuffle using Node&apos;s{" "}
            <code className="rounded bg-midnight px-1.5 py-0.5 font-mono text-xs text-chalk">
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
            <span className="font-semibold text-chalk">before</span> the draw time. See the warning below.
          </li>
          <li className="flex gap-2">
            <span className="text-signal">·</span>
            <a
              href="https://github.com/fantasy-draft-order/fantasy-draft-order"
              target="_blank"
              rel="noreferrer"
              className="text-chalk underline underline-offset-2 hover:text-signal"
            >
              Source code is public.
            </a>
          </li>
        </ul>
      </section>
    );
  }
  const commitUrl = state.commitSha
    ? `https://github.com/fantasy-draft-order/fantasy-draft-order/blob/${state.commitSha}/src/lib/randomizer.ts`
    : "https://github.com/fantasy-draft-order/fantasy-draft-order/blob/main/src/lib/randomizer.ts";
  return (
    <section className="rounded-2xl border border-sideline/50 bg-sideline/10 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="size-4 text-signal" />
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-signal">
          Audit trail
        </h3>
      </div>
      <dl className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-[180px_1fr]">
        <AuditRow label="Method">
          Fisher–Yates shuffle ·{" "}
          <code className="rounded bg-midnight px-1.5 py-0.5 font-mono text-xs text-chalk">
            crypto.randomInt
          </code>
        </AuditRow>
        <AuditRow label="Source">
          <a
            href={commitUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-chalk underline underline-offset-2 hover:text-signal"
          >
            randomizer.ts{state.commitSha ? `@${state.commitSha.slice(0, 7)}` : ""}
          </a>
        </AuditRow>
        {state.seed && (
          <AuditRow label="Seed">
            <span className="font-mono text-xs break-all text-chalk">{state.seed}</span>
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
      <dt className="font-mono text-xs uppercase tracking-wider text-hashmark">
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
        className="size-9 shrink-0 rounded-full object-cover ring-1 ring-sideline"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-signal/15 text-xs font-bold text-signal ring-1 ring-signal/30">
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
