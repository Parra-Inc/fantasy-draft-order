"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { AlertTriangle, Check, Copy, Shield, Skull } from "lucide-react";
import { env } from "@/lib/env";
import type {
  PunishmentOptionView,
  PunishmentStateView,
} from "@/lib/punishment-state";
import { PromoShelf } from "@/components/promo-shelf";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** A disclosed elimination, with its timestamp already parsed. */
type Landing = { position: number; eliminatedAt: number };

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

  const options = state.options;
  const total = options.length;
  const spinStartMs = new Date(state.spinStartAt).getTime();
  const revealedMs = new Date(state.revealedAt).getTime();
  const scheduledMs = new Date(state.scheduledFor).getTime();

  // Armed a beat before the wheel is due, so the animation loops are already
  // mounted when the first spin starts, and so a page opened long after the
  // draw still runs one frame to park the wheel on its final segment.
  const armed = now >= spinStartMs - 2000;
  const settled = state.status === "COMPLETED";

  // Poll hard once the spin is imminent so the draw lands together for
  // everyone, slowly before that, and not at all once the result is in: the
  // record is immutable, so there is nothing further to learn.
  //
  // Keyed off a boolean rather than `now` on purpose. An interval whose effect
  // re-runs on every 250ms tick is torn down before it can ever fire.
  useEffect(() => {
    if (settled) return;
    const id = setInterval(() => void mutate(), armed ? 350 : 1500);
    return () => clearInterval(id);
  }, [settled, armed, mutate]);

  const landings: Landing[] = useMemo(
    () =>
      state.eliminations.map((e) => ({
        position: e.position,
        eliminatedAt: new Date(e.eliminatedAt).getTime(),
      })),
    [state.eliminations],
  );

  // How many eliminations have actually landed. Driven by rAF rather than the
  // 250ms tick so a strike-through lands on the same frame the wheel stops on
  // it, and stopped for good once the last option is out.
  const [landedCount, setLandedCount] = useState(() =>
    countLanded(
      initial.eliminations.map((e) => ({
        position: e.position,
        eliminatedAt: new Date(e.eliminatedAt).getTime(),
      })),
      new Date(initial.serverTime).getTime(),
    ),
  );

  useEffect(() => {
    if (!armed) return;
    let raf = 0;
    const tick = () => {
      const count = countLanded(landings, Date.now());
      setLandedCount((prev) => (prev === count ? prev : count));
      if (count < total - 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [armed, landings, total]);

  const eliminated = useMemo(
    () => new Set(landings.slice(0, landedCount).map((l) => l.position)),
    [landings, landedCount],
  );
  const lastOut =
    landedCount > 0
      ? (options.find(
          (o) => o.position === landings[landedCount - 1].position,
        ) ?? null)
      : null;

  // The one option the wheel never landed on. The server stays the authority on
  // the result; this only closes the gap between the final strike-through and
  // the next poll coming back, and it is gated on the same revealedAt the
  // server gates on, so it cannot surface the answer a moment early.
  const survivor = useMemo(() => {
    if (landings.length < total - 1) return null;
    const out = new Set(landings.map((l) => l.position));
    return options.find((o) => !out.has(o.position)) ?? null;
  }, [landings, options, total]);
  const chosen = state.chosen ?? (now >= revealedMs ? survivor : null);
  const isDone = now >= revealedMs || settled;

  return (
    /*
      Same two shapes as the draft page, one DOM order. Below `lg` this is a
      single column with the shelf last. At `lg` and up the shelf becomes a
      sticky right rail spanning both content rows, so the wheel and the trust
      narrative under it stay contiguous instead of being interrupted by it.

      The shelf renders in every state, SPINNING included. It is deliberately
      the quietest thing on the page (see PromoShelf), and pulling it mid-spin
      would reflow the layout at the exact second everyone is watching.
    */
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-x-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-8 lg:col-start-1 lg:row-start-1">
        <Header state={state} />
        {/* Only until the wheel actually starts turning. After that the wheel
            itself is the status, and a second "starting now" panel above it is
            noise at the one moment the page has everyone's attention. */}
        {now < spinStartMs && (
          <Countdown
            now={now}
            scheduledMs={scheduledMs}
            scheduledFor={state.scheduledFor}
          />
        )}
        <WheelStage
          options={options}
          landings={landings}
          eliminated={eliminated}
          landedCount={landedCount}
          lastOut={lastOut}
          chosen={chosen}
          armed={armed}
          spinStartMs={spinStartMs}
          revealedMs={revealedMs}
          perSpinMs={state.spinDurationMs}
        />
        {chosen && <Result state={state} chosen={chosen} />}
        {/* Directly under the result, not at the foot of the page. The reveal is
            the only second this wheel has an audience, and the full option list
            plus the audit trail is a long scroll to put between the punishment
            and the button that gets it into the group chat. */}
        {isDone && <ShareRow state={state} />}
      </div>

      {/* `self-start` is what makes the sticky work: a stretched grid item is
          already as tall as its area and has nowhere to travel. */}
      <aside className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <PromoShelf surface={isDone ? "results" : "pre-draw"} />
      </aside>

      <div className="flex flex-col gap-8 lg:col-start-1 lg:row-start-2">
        <OptionList
          options={options}
          eliminated={eliminated}
          chosenPosition={chosen?.position ?? null}
        />
        <TrustPanel state={state} />
      </div>
    </div>
  );
}

function countLanded(landings: Landing[], at: number): number {
  let count = 0;
  while (count < landings.length && landings[count].eliminatedAt <= at) count++;
  return count;
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
  now,
  scheduledMs,
  scheduledFor,
}: {
  now: number;
  scheduledMs: number;
  scheduledFor: string;
}) {
  // Counts to the announced time, which is the one printed below it, not to
  // the first spin a few seconds later.
  const remaining = Math.max(0, scheduledMs - now);

  // The gap between the announced time and the first spin is the same
  // "everyone is here" beat the draft leaves before its first pick. Say so,
  // rather than sitting on a countdown reading 00:00:00.
  if (remaining === 0) {
    return (
      <section className="border-signal/40 bg-signal/5 rounded-2xl border p-6 text-center">
        <p className="text-signal inline-flex items-center gap-2 font-mono text-xs tracking-wider uppercase">
          <span className="relative flex size-2">
            <span className="bg-signal absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
            <span className="bg-signal relative inline-flex size-2 rounded-full" />
          </span>
          Starting now
        </p>
        <p className="font-display text-chalk mt-3 text-2xl font-extrabold sm:text-3xl">
          The wheel is spinning up…
        </p>
      </section>
    );
  }

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
        {new Date(scheduledFor).toLocaleString()}
      </p>
    </section>
  );
}

/* --------------------------------------------------------------------------
   The wheel
   -------------------------------------------------------------------------- */

const WHEEL_RADIUS = 94;
/** Degrees per ms while the wheel is waiting on a target that has not arrived. */
const IDLE_DEG_PER_MS = 0.03;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** Full turns per elimination spin. Longer spins get more revolutions. */
function turnsFor(perSpinMs: number) {
  return Math.min(5, Math.max(2, Math.round(perSpinMs / 380)));
}

/** Degrees are measured clockwise from 12 o'clock, where the pointer sits. */
function polar(radius: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [radius * Math.sin(rad), -radius * Math.cos(rad)];
}

function sectorPath(radius: number, from: number, to: number) {
  const [x0, y0] = polar(radius, from);
  const [x1, y1] = polar(radius, to);
  const largeArc = to - from > 180 ? 1 : 0;
  return `M 0 0 L ${x0.toFixed(3)} ${y0.toFixed(3)} A ${radius} ${radius} 0 ${largeArc} 1 ${x1.toFixed(3)} ${y1.toFixed(3)} Z`;
}

function fitLabel(label: string, max: number) {
  return label.length > max ? `${label.slice(0, max - 1).trimEnd()}…` : label;
}

/**
 * The wheel, which physically spins.
 *
 * Each disclosed elimination is a target segment, and the rotation is a pure
 * function of the wall clock, the sequence start and the server's per-spin
 * duration, never of accumulated local state. Two people who open the page
 * eight seconds apart therefore see the wheel in the same position at the same
 * instant, and a tab that was throttled in the background catches up on its
 * next frame instead of drifting out of sync forever.
 */
function SpinWheel({
  options,
  landings,
  eliminated,
  chosenPosition,
  armed,
  spinStartMs,
  revealedMs,
  perSpinMs,
}: {
  options: PunishmentOptionView[];
  landings: Landing[];
  eliminated: Set<number>;
  chosenPosition: number | null;
  armed: boolean;
  spinStartMs: number;
  revealedMs: number;
  perSpinMs: number;
}) {
  const rotorRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const segments = options.length;
  const sweep = 360 / segments;

  // The absolute angle the wheel has to reach for each landing: a whole number
  // of turns, plus whatever brings that segment under the pointer. Strictly
  // increasing, so the wheel only ever turns forwards.
  const targets = useMemo(() => {
    const turns = turnsFor(perSpinMs);
    return landings.map((landing, index) => {
      const rest = (360 - (((landing.position + 0.5) * sweep) % 360)) % 360;
      return 360 * turns * (index + 1) + rest;
    });
  }, [landings, sweep, perSpinMs]);

  const angleAt = useCallback(
    (at: number) => {
      if (landings.length === 0) return 0;
      const active = landings.findIndex((l) => l.eliminatedAt > at);
      if (active === -1) {
        const last = landings.length - 1;
        if (landings.length >= segments - 1) return targets[last];
        // The next target has not arrived yet (a slow poll, normally never
        // seen). Drift rather than freeze; the next flick swallows the
        // handful of degrees of correction.
        return (
          targets[last] + (at - landings[last].eliminatedAt) * IDLE_DEG_PER_MS
        );
      }
      const from = active === 0 ? 0 : targets[active - 1];
      const since =
        active === 0 ? spinStartMs : landings[active - 1].eliminatedAt;
      const span = Math.max(1, landings[active].eliminatedAt - since);
      const progress = Math.min(1, Math.max(0, (at - since) / span));
      return from + (targets[active] - from) * easeOutCubic(progress);
    },
    [landings, targets, segments, spinStartMs],
  );

  useEffect(() => {
    const node = rotorRef.current;
    if (!node || !armed) return;
    if (reduceMotion) {
      // Nothing spins for anyone who asked not to be spun at. The options still
      // get struck out one at a time, which is the information; the rotation
      // was only ever the theatre.
      node.style.transform = "rotate(0deg)";
      return;
    }
    let raf = 0;
    const tick = () => {
      const at = Date.now();
      node.style.transform = `rotate(${angleAt(at).toFixed(2)}deg)`;
      if (at < revealedMs + 400) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [armed, reduceMotion, angleAt, revealedMs]);

  // Past a dozen segments no label fits at a size anyone could read, so those
  // wheels carry the numbers from the list instead.
  const showLabels = segments <= 12;
  const textRadius = showLabels ? 58 : 76;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[22rem] sm:max-w-[26rem]">
      <div
        ref={rotorRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: "rotate(0deg)" }}
      >
        <svg viewBox="-104 -104 208 208" className="size-full">
          <circle
            r={WHEEL_RADIUS + 5}
            fill="#0A1628"
            stroke="rgba(30,41,59,0.9)"
            strokeWidth={3}
          />
          {options.map((option, index) => {
            const isOut = eliminated.has(option.position);
            const isChosen = chosenPosition === option.position;
            return (
              <path
                key={`sector-${option.position}`}
                d={sectorPath(WHEEL_RADIUS, index * sweep, (index + 1) * sweep)}
                fill={
                  isChosen
                    ? "rgba(0,230,118,0.3)"
                    : isOut
                      ? "#0B1524"
                      : index % 2 === 0
                        ? "#1B2C48"
                        : "#152238"
                }
                stroke={isChosen ? "#00E676" : "rgba(10,22,40,0.85)"}
                strokeWidth={isChosen ? 1.5 : 0.75}
                className="transition-[fill,stroke] duration-300"
              />
            );
          })}
          {options.map((option, index) => {
            const center = index * sweep + sweep / 2;
            // Radial text, flipped on the left half so it never reads upside
            // down.
            const flip = center > 180;
            const isOut = eliminated.has(option.position);
            const isChosen = chosenPosition === option.position;
            return (
              <g
                key={`label-${option.position}`}
                transform={`rotate(${center}) translate(0,-${textRadius}) rotate(${flip ? 90 : -90})`}
              >
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={showLabels ? (segments <= 8 ? 7 : 6) : 9}
                  fontWeight={700}
                  fill={isChosen ? "#00E676" : isOut ? "#3F4C63" : "#F5F5F0"}
                  style={{ textDecoration: isOut ? "line-through" : "none" }}
                  className="transition-[fill] duration-300"
                >
                  {showLabels
                    ? fitLabel(option.label, 22)
                    : String(option.position + 1)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Pointer, in its own un-rotated layer sharing the same viewBox so it
          lines up with the rim exactly at every size. */}
      <svg
        viewBox="-104 -104 208 208"
        className="pointer-events-none absolute inset-0 size-full"
        aria-hidden
      >
        <polygon points="0,-82 -9,-104 9,-104" fill="#00E676" />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="bg-midnight ring-signal/30 flex flex-col items-center justify-center rounded-full shadow-[0_0_28px_rgba(0,230,118,0.15)] ring-2"
          style={{ width: "25%", height: "25%" }}
        >
          {chosenPosition !== null ? (
            <Skull className="text-signal size-5 sm:size-6" />
          ) : (
            <>
              <span className="font-display text-chalk text-lg leading-none font-extrabold tabular-nums sm:text-xl">
                {segments - eliminated.size}
              </span>
              <span className="text-hashmark mt-1 font-mono text-[8px] tracking-wider uppercase">
                left
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function WheelStage({
  options,
  landings,
  eliminated,
  landedCount,
  lastOut,
  chosen,
  armed,
  spinStartMs,
  revealedMs,
  perSpinMs,
}: {
  options: PunishmentOptionView[];
  landings: Landing[];
  eliminated: Set<number>;
  landedCount: number;
  lastOut: PunishmentOptionView | null;
  chosen: PunishmentOptionView | null;
  armed: boolean;
  spinStartMs: number;
  revealedMs: number;
  perSpinMs: number;
}) {
  const total = options.length;
  const spinning = armed && !chosen;

  return (
    <section
      className="border-sideline/50 bg-sideline/10 rounded-2xl border p-5 sm:p-8"
      data-testid="punishment-wheel"
      data-landed={landedCount}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] tracking-wider uppercase sm:text-xs">
          {spinning ? (
            <span className="text-signal inline-flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="bg-signal absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-signal relative inline-flex size-2 rounded-full" />
              </span>
              Spinning
            </span>
          ) : chosen ? (
            <span className="text-signal">Last one standing</span>
          ) : (
            <span className="text-hashmark">Sealed until the draw</span>
          )}
        </p>
        <span className="text-hashmark font-mono text-[11px] sm:text-xs">
          {`${landedCount} / ${total - 1} eliminated`}
        </span>
      </div>

      <SpinWheel
        options={options}
        landings={landings}
        eliminated={eliminated}
        chosenPosition={chosen?.position ?? null}
        armed={armed}
        spinStartMs={spinStartMs}
        revealedMs={revealedMs}
        perSpinMs={perSpinMs}
      />

      <div className="mt-5 flex min-h-10 items-center justify-center">
        <AnimatePresence mode="wait">
          {chosen ? (
            <motion.p
              key="chosen"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="font-display text-signal text-center text-sm font-bold text-balance sm:text-base"
            >
              {chosen.label}
            </motion.p>
          ) : lastOut ? (
            <motion.p
              key={`out-${lastOut.position}`}
              initial={{ opacity: 0, y: 10, scale: 1.06 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="text-hashmark text-center text-sm text-balance"
              aria-live="polite"
            >
              <span className="text-blitz font-mono text-[11px] tracking-wider uppercase">
                {"Out · "}
              </span>
              <span className="line-through">{lastOut.label}</span>
            </motion.p>
          ) : (
            <motion.p
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-hashmark text-center text-sm text-balance"
            >
              One option gets knocked out per spin. The last one standing is the
              punishment.
            </motion.p>
          )}
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
  chosen: PunishmentOptionView;
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
        {`Last one standing out of ${state.options.length}, at ${new Date(
          state.revealedAt,
        ).toLocaleString()}`}
      </p>
    </motion.section>
  );
}

function OptionList({
  options,
  eliminated,
  chosenPosition,
}: {
  options: PunishmentOptionView[];
  eliminated: Set<number>;
  chosenPosition: number | null;
}) {
  return (
    <section>
      <h2 className="font-display text-hashmark mb-3 text-xs font-bold tracking-wider uppercase">
        {`On the wheel · ${options.length}`}
      </h2>
      <ul className="border-sideline/50 divide-sideline/30 divide-y overflow-hidden rounded-2xl border">
        {options.map((option) => {
          const isChosen = option.position === chosenPosition;
          const isOut = eliminated.has(option.position);
          return (
            <motion.li
              key={option.position}
              animate={{ opacity: isOut ? 0.45 : 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`flex items-center gap-3 px-4 py-3 sm:px-6 ${
                isChosen ? "bg-signal/10" : "bg-midnight/40"
              }`}
              data-eliminated={isOut ? "true" : undefined}
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
              <span className="min-w-0 flex-1">
                {/* inline-block so the wipe spans exactly the label, max-w-full
                    so a long one still wraps inside it. */}
                <span
                  className={`relative inline-block max-w-full text-sm ${
                    isChosen ? "text-chalk font-semibold" : "text-hashmark"
                  }`}
                >
                  {option.label}
                  <motion.span
                    aria-hidden
                    initial={false}
                    animate={{ scaleX: isOut ? 1 : 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="bg-blitz absolute inset-x-0 top-1/2 h-[1.5px] origin-left rounded-full"
                  />
                </span>
              </span>
              {isChosen && <Check className="text-signal size-4 shrink-0" />}
            </motion.li>
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
            At the scheduled time the wheel starts spinning on its own and
            knocks out one option per spin. The last one standing is the
            punishment.
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
        <AuditRow label="Spin order">
          <span className="text-hashmark text-xs">
            derived from the seed: the order the losing options were knocked
            out, not what was chosen
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
