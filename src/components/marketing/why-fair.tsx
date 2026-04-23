import { Code2, Eye, Clock, Lock } from "lucide-react";

const PILLARS = [
  {
    icon: Code2,
    title: "Open source, on purpose",
    body: "Every line of the randomizer lives on GitHub. Each draft links to the exact commit used to pick it — audit it yourself.",
  },
  {
    icon: Eye,
    title: "Everyone watches together",
    body: "No one runs the draw in private and emails a screenshot. The whole league sees the same animation at the same moment.",
  },
  {
    icon: Lock,
    title: "Immutable once scheduled",
    body: "Teams and time are frozen the moment you create the draft. The commissioner can't edit, re-run, or re-roll it.",
  },
  {
    icon: Clock,
    title: "Permanent audit trail",
    body: "Every draft's URL stores the seed, start and finish timestamps, and the source commit — forever.",
  },
];

export function WhyFair() {
  return (
    <section
      id="trust"
      className="scroll-mt-20 border-y border-sideline/50 bg-sideline/10"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-signal">
            Why it&apos;s fair
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-chalk sm:text-5xl">
            Trust, not by promise.{" "}
            <span className="text-signal">By design.</span>
          </h2>
          <p className="mt-4 text-hashmark">
            Every other draft randomizer asks you to trust the person running it. We took that person out of the loop.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-sideline/50 bg-midnight/60 p-6 transition-colors hover:border-signal/30"
            >
              <div className="inline-flex size-11 items-center justify-center rounded-xl bg-signal/10 text-signal ring-1 ring-signal/30">
                <p.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-chalk">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-hashmark">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
