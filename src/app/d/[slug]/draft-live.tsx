"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

type Team = {
  id: string;
  name: string;
  ownerName: string | null;
  avatarUrl: string | null;
  position: number;
};

type Pick = { teamId: string; pickNumber: number; revealedAt: string };

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

export function DraftLive({ slug, initial }: { slug: string; initial: DraftState }) {
  const scheduledAt = new Date(initial.scheduledFor).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const drawing = initial.status === "DRAWING" || now >= scheduledAt;
  const refreshInterval = drawing ? 1000 : now + 60_000 >= scheduledAt ? 1500 : 4000;

  const { data } = useSWR<DraftState>(
    `/api/drafts/${slug}/state`,
    fetcher,
    {
      fallbackData: initial,
      refreshInterval: (latest) =>
        latest?.status === "COMPLETED" && (!latest.nextPickAt) ? 0 : refreshInterval,
      revalidateOnFocus: false,
    },
  );

  const state = data ?? initial;

  return (
    <div className="space-y-10">
      <Header state={state} now={now} scheduledAt={scheduledAt} />
      {state.status === "SCHEDULED" ? (
        <TeamsGrid teams={state.teams} />
      ) : (
        <DrawBoard state={state} />
      )}
      <TrustPanel state={state} />
    </div>
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
    <header className="space-y-4">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">
        {state.importSource && state.importSource !== "MANUAL"
          ? `${state.importSource} · `
          : ""}
        {state.teams.length} teams · by {state.creatorName}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        {state.leagueName}
      </h1>
      {state.status === "SCHEDULED" && (
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-3xl tabular-nums sm:text-4xl">
            {formatCountdown(remaining)}
          </span>
          <span className="text-muted-foreground">
            until {new Date(state.scheduledFor).toLocaleString()}
          </span>
        </div>
      )}
      {state.status === "DRAWING" && (
        <p className="text-xl text-muted-foreground">Drawing the order…</p>
      )}
      {state.status === "COMPLETED" && state.completedAt && (
        <p className="text-sm text-muted-foreground">
          Completed {new Date(state.completedAt).toLocaleString()}
        </p>
      )}
    </header>
  );
}

function TeamsGrid({ teams }: { teams: Team[] }) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Teams
      </h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {teams.map((team) => (
          <li
            key={team.id}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <Avatar name={team.name} url={team.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate font-medium">{team.name}</p>
              {team.ownerName && (
                <p className="truncate text-sm text-muted-foreground">{team.ownerName}</p>
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
  const slots = Array.from({ length: state.teams.length }, (_, i) => i + 1);
  const pickByNumber = new Map(state.picks.map((p) => [p.pickNumber, p]));
  const nextPickNumber = state.picks.length + 1;
  const [tick, setTick] = useState(0);
  const spinnerRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      spinnerRef.current = (spinnerRef.current + 1) % Math.max(state.teams.length, 1);
      setTick((t) => t + 1);
    }, 80);
    return () => clearInterval(id);
  }, [state.teams.length]);

  const spinningTeam =
    state.status === "DRAWING" && nextPickNumber <= state.teams.length
      ? state.teams[spinnerRef.current % state.teams.length]
      : null;

  return (
    <section className="space-y-6">
      <ol className="space-y-2">
        {slots.map((pickNumber) => {
          const pick = pickByNumber.get(pickNumber);
          const team = pick ? teamById.get(pick.teamId) : null;
          const isSpinning = !pick && pickNumber === nextPickNumber && spinningTeam;
          return (
            <li
              key={pickNumber}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <span className="w-8 text-right font-mono tabular-nums text-muted-foreground">
                {pickNumber}.
              </span>
              {team ? (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-1 items-center gap-3"
                >
                  <Avatar name={team.name} url={team.avatarUrl} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{team.name}</p>
                    {team.ownerName && (
                      <p className="truncate text-sm text-muted-foreground">
                        {team.ownerName}
                      </p>
                    )}
                  </div>
                </motion.div>
              ) : isSpinning ? (
                <div className="flex flex-1 items-center gap-3">
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={spinningTeam!.id + tick}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-3"
                    >
                      <Avatar name={spinningTeam!.name} url={spinningTeam!.avatarUrl} />
                      <span className="font-medium text-muted-foreground">
                        {spinningTeam!.name}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TrustPanel({ state }: { state: DraftState }) {
  if (state.status === "SCHEDULED") {
    return (
      <section className="rounded-lg border bg-muted/30 p-4 text-sm">
        <h3 className="mb-2 font-medium">How this draft works</h3>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>The draw fires automatically at the scheduled time. No one can run it early or twice.</li>
          <li>
            The randomizer is a Fisher–Yates shuffle using Node&apos;s{" "}
            <code className="font-mono text-xs">crypto.randomInt</code> (CSPRNG).
          </li>
          <li>Teams shown above are locked in — they cannot be edited.</li>
          <li>
            <a
              href="https://github.com/fantasy-draft-order/fantasy-draft-order"
              className="underline underline-offset-2"
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
    <section className="rounded-lg border bg-muted/30 p-4 text-sm">
      <h3 className="mb-3 font-medium">Audit trail</h3>
      <dl className="grid grid-cols-1 gap-2 text-muted-foreground sm:grid-cols-[180px_1fr]">
        <dt>Method</dt>
        <dd>
          Fisher–Yates shuffle · <code className="font-mono">crypto.randomInt</code>
        </dd>
        <dt>Source</dt>
        <dd>
          <a href={commitUrl} className="underline underline-offset-2">
            randomizer.ts{state.commitSha ? `@${state.commitSha.slice(0, 7)}` : ""}
          </a>
        </dd>
        {state.seed && (
          <>
            <dt>Seed</dt>
            <dd className="font-mono text-xs break-all">{state.seed}</dd>
          </>
        )}
        <dt>Scheduled</dt>
        <dd>{new Date(state.scheduledFor).toLocaleString()}</dd>
        {state.startedAt && (
          <>
            <dt>Started</dt>
            <dd>{new Date(state.startedAt).toLocaleString()}</dd>
          </>
        )}
        {state.completedAt && (
          <>
            <dt>Completed</dt>
            <dd>{new Date(state.completedAt).toLocaleString()}</dd>
          </>
        )}
      </dl>
    </section>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />;
  }
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
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
