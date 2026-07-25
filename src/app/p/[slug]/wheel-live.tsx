"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { AlertTriangle, Check, Copy, Shield, Skull } from "lucide-react";
import { env } from "@/lib/env";
import type { PunishmentStateView } from "@/lib/punishment-state";
import { PromoShelf } from "@/components/promo-shelf";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function WheelLive({
  slug,
  initial,
}: {
  slug: string;
  initial: PunishmentStateView;
}) {
  // Seed from the server clock that produced this HTML, not Date.now(): the
  // browser hydrates seconds later, so a client-seeded countdown is guaranteed
  // to disagree with the markup and fail hydration.
  //
  // The first interval tick then takes over with the local clock. Note there is
  // deliberately no synchronous setNow() in the effect body to "catch up"
  // immediately: that is a cascading render (react-hooks/set-state-in-effect),
  // and the 250ms until the first tick is not perceptible on a countdown.
  const [now, setNow] = useState(() => new Date(initial.serverTime).getTime());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const { data, mutate } = useSWR<PunishmentStateView>(
    `/api/punishments/${slug}/state`,
    fetcher,
    { fallbackData: initial, revalidateOnFocus: true },
  );
  const state = data ?? initial;

  const spinStartMs = new Date(state.spinStartAt).getTime();
  const isDone = state.status === "COMPLETED";

  // Poll hard once the spin is imminent so the reveal lands together for
  // everyone, and slowly before that. Stop entirely once the result is in:
  // the record is immutable, so there is nothing further to learn.
  useEffect(() => {
    if (isDone) return;
    const id = setInterval(() => void mutate(), now >= spinStartMs ? 400 : 1500);
    return () => clearInterval(id);
  }, [isDone, mutate, now, spinStartMs]);

  return (
    <div className="flex flex-col gap-8">
      <Header state={state} />
      {isDone && state.chosen ? (
        <Result state={state} chosen={state.chosen} />
      ) : state.status === "SPINNING" ? (
        <Spinner state={state} />
      ) : (
        <Countdown state={state} now={now} />
      )}
      <OptionList state={state} />
      <TrustPanel state={state} />
      {isDone && <ShareRow state={state} />}
      <PromoShelf surface={isDone ? "results" : "pre-draw"} />
    </div>
  );
}

function Header({ state }: { state: PunishmentStateView }) {
  return (
    <div className="text-center">
      <p className="font-display text-signal text-xs font-bold tracking-[0.2em] uppercase">
        {state.leagueName}
      </p>
      <h1 className="font-display text-chalk mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
        {state.loserName}
      </h1>
      <p className="text-hashmark mt-2 text-sm">
        finished last, and the wheel decides the punishment
      </p>
    </div>
  );
}

function Countdown({
  state,
  now,
}: {
  state: PunishmentStateView;
  now: number;
}) {
  const remaining = Math.max(0, new Date(state.revealedAt).getTime() - now);
  const totalSeconds = Math.ceil(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <section className="border-sideline/50 bg-sideline/10 rounded-2xl border p-8 text-center">
      <p className="text-hashmark font-mono text-xs tracking-wider uppercase">
        Spins in
      </p>
      <p className="font-display text-chalk mt-3 text-4xl font-extrabold tabular-nums sm:text-6xl">
        {days > 0 && `${days}d `}
        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </p>
      <p className="text-hashmark mt-4 text-sm">
        {new Date(state.revealedAt).toLocaleString()}
      </p>
    </section>
  );
}

/**
 * The spin. Purely decorative: it cycles through the option labels at a fixed
 * rate, and the actual answer arrives from the server when revealedAt passes.
 * The client is never told the result early, so there is nothing here to
 * inspect in devtools ahead of time.
 */
function Spinner({ state }: { state: PunishmentStateView }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % state.options.length),
      90,
    );
    return () => clearInterval(id);
  }, [state.options.length]);

  return (
    <section className="border-signal/40 bg-signal/5 rounded-2xl border p-8 text-center">
      <p className="text-signal font-mono text-xs tracking-wider uppercase">
        Drawing
      </p>
      <div className="mt-4 flex h-20 items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.p
            key={index}
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -28, opacity: 0 }}
            transition={{ duration: 0.09, ease: "linear" }}
            className="font-display text-chalk text-xl font-bold sm:text-2xl"
          >
            {state.options[index]?.label}
          </motion.p>
        </AnimatePresence>
      </div>
    </section>
  );
}

function Result({
  state,
  chosen,
}: {
  state: PunishmentStateView;
  chosen: { label: string; position: number };
}) {
  return (
    <motion.section
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="border-signal/40 bg-signal/5 rounded-2xl border p-8 text-center"
    >
      <div className="text-signal flex items-center justify-center gap-2">
        <Skull className="size-4" />
        <p className="font-mono text-xs tracking-wider uppercase">
          The punishment
        </p>
      </div>
      <p className="font-display text-chalk mt-4 text-2xl font-extrabold text-balance sm:text-4xl">
        {chosen.label}
      </p>
      <p className="text-hashmark mt-5 text-sm">
        Drawn from {state.options.length} options at{" "}
        {new Date(state.revealedAt).toLocaleString()}
      </p>
    </motion.section>
  );
}

function OptionList({ state }: { state: PunishmentStateView }) {
  const chosenPosition = state.chosen?.position ?? null;
  return (
    <section>
      <h2 className="font-display text-hashmark mb-3 text-xs font-bold tracking-wider uppercase">
        On the wheel · {state.options.length}
      </h2>
      <ul className="border-sideline/50 divide-sideline/30 divide-y overflow-hidden rounded-2xl border">
        {state.options.map((option) => {
          const isChosen = option.position === chosenPosition;
          return (
            <li
              key={option.position}
              className={`flex items-center gap-3 px-4 py-3 sm:px-6 ${
                isChosen ? "bg-signal/10" : "bg-midnight/40"
              }`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold tabular-nums ring-1 ${
                  isChosen
                    ? "bg-signal/20 text-signal ring-signal/40"
                    : "text-hashmark ring-sideline/40"
                }`}
              >
                {option.position + 1}
              </span>
              <span
                className={`flex-1 text-sm ${isChosen ? "text-chalk font-semibold" : "text-hashmark"}`}
              >
                {option.label}
              </span>
              {isChosen && <Check className="text-signal size-4 shrink-0" />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TrustPanel({ state }: { state: PunishmentStateView }) {
  const commitUrl = state.commitSha
    ? `https://github.com/Parra-Inc/fantasy-draft-order/blob/${state.commitSha}/src/lib/randomizer.ts`
    : "https://github.com/Parra-Inc/fantasy-draft-order/blob/main/src/lib/randomizer.ts";

  if (state.status !== "COMPLETED") {
    return (
      <section className="border-sideline/50 bg-sideline/10 rounded-2xl border p-6">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="text-signal size-4" />
          <h3 className="font-display text-signal text-sm font-bold tracking-wider uppercase">
            How this wheel works
          </h3>
        </div>
        <ul className="text-hashmark space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-signal">·</span>
            The result was drawn and sealed when this wheel was created. Nobody
            can see it, including whoever made it, until the time above.
          </li>
          <li className="flex gap-2">
            <span className="text-signal">·</span>
            The options above are locked. Nothing can be added, removed or
            reworded now.
          </li>
          <li className="flex gap-2">
            <span className="text-signal">·</span>
            The randomizer is a Fisher–Yates shuffle using Node&apos;s{" "}
            <code className="bg-midnight text-chalk rounded px-1.5 py-0.5 font-mono text-xs">
              crypto.randomInt
            </code>{" "}
            (CSPRNG) — the same code that draws draft orders on this site.
          </li>
          <li className="flex gap-2">
            <span className="text-signal">·</span>
            This is only proof if you got the link{" "}
            <span className="text-chalk font-semibold">before</span> the spin.
            See the warning below.
          </li>
        </ul>
      </section>
    );
  }

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
        <AuditRow label="Seed">
          <span className="text-chalk font-mono text-xs break-all">
            {state.seed}
          </span>
        </AuditRow>
        <AuditRow label="Options">{state.options.length}</AuditRow>
        <AuditRow label="Created">
          {new Date(state.createdAt).toLocaleString()}
        </AuditRow>
        <AuditRow label="Scheduled">
          {new Date(state.scheduledFor).toLocaleString()}
        </AuditRow>
        <AuditRow label="Drawn">
          {new Date(state.revealedAt).toLocaleString()}
        </AuditRow>
      </dl>
      <div className="border-sideline/50 text-hashmark mt-5 flex gap-2 border-t pt-4 text-xs">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
        <p>
          A sealed result only proves anything to people who had this link
          before the spin. If you were sent it afterwards, all you know is that
          nobody edited it since.
        </p>
      </div>
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

function ShareRow({ state }: { state: PunishmentStateView }) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(
    () => `${env.NEXT_PUBLIC_BASE_URL}/p/${state.slug}`,
    [state.slug],
  );

  return (
    <section className="border-sideline/50 bg-sideline/10 rounded-2xl border p-6">
      <h3 className="font-display text-chalk text-sm font-bold">
        Put it in the group chat
      </h3>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="border-sideline text-chalk hover:border-signal/50 inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors"
        >
          {copied ? (
            <Check className="text-signal size-4" />
          ) : (
            <Copy className="size-4" />
          )}
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          href={`/p/${state.slug}/card`}
          target="_blank"
          rel="noreferrer"
          className="border-sideline text-chalk hover:border-signal/50 inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors"
        >
          Download the card
        </a>
        <a
          href="/punishment/new?src=PUNISHMENT_RESULT"
          className="bg-signal text-midnight hover:bg-signal-dark inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors"
        >
          Spin another
        </a>
      </div>
    </section>
  );
}
