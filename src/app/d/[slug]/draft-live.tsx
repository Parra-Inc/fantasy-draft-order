"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { Calendar, Shield, Trophy, Users } from "lucide-react";

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
        latest?.status === "COMPLETED" && !latest.nextPickAt ? 0 : refreshInterval,
      revalidateOnFocus: false,
    },
  );

  const state = data ?? initial;

  return (
    <div className="space-y-8">
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

      {state.status === "SCHEDULED" && (
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
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-signal">
          Draft order
        </h2>
        <span className="text-xs text-hashmark">
          {state.picks.length} / {state.teams.length} revealed
        </span>
      </div>
      <ol className="overflow-hidden rounded-2xl border border-sideline/50 bg-sideline/10">
        {slots.map((pickNumber, idx) => {
          const pick = pickByNumber.get(pickNumber);
          const team = pick ? teamById.get(pick.teamId) : null;
          const isSpinning = !pick && pickNumber === nextPickNumber && spinningTeam;
          const revealed = !!team;
          return (
            <li
              key={pickNumber}
              className={`flex items-center gap-4 px-4 py-3 transition-colors sm:px-6 ${
                idx !== 0 ? "border-t border-sideline/30" : ""
              } ${revealed ? "bg-midnight/40" : ""}`}
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold tabular-nums ${
                  revealed
                    ? "bg-signal/15 text-signal ring-1 ring-signal/30"
                    : isSpinning
                      ? "bg-signal/10 text-signal ring-1 ring-signal/30"
                      : "bg-sideline/40 text-hashmark"
                }`}
              >
                {pickNumber}
              </div>
              {team ? (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-1 items-center gap-3 min-w-0"
                >
                  <Avatar name={team.name} url={team.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-chalk">
                      {team.name}
                    </p>
                    {team.ownerName && (
                      <p className="truncate text-xs text-hashmark">
                        {team.ownerName}
                      </p>
                    )}
                  </div>
                  <span className="hidden font-mono text-[10px] text-hashmark/60 sm:inline">
                    pck_{pickNumber.toString().padStart(3, "0")}
                  </span>
                </motion.div>
              ) : isSpinning ? (
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={spinningTeam!.id + tick}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-3 min-w-0"
                    >
                      <Avatar
                        name={spinningTeam!.name}
                        url={spinningTeam!.avatarUrl}
                      />
                      <span className="truncate font-semibold text-signal">
                        {spinningTeam!.name}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <div className="size-9 rounded-full border border-dashed border-hashmark/30" />
                  <span className="text-sm text-hashmark/60">—</span>
                </div>
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
