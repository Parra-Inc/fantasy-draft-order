import { Calendar, Link2, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: Calendar,
    title: "Schedule the draw",
    body: "Enter your teams manually, or paste a Sleeper / MFL / Fleaflicker / ESPN league ID. Pick a date and time.",
  },
  {
    icon: Link2,
    title: "Share the link",
    body: "Everyone sees the same synchronized countdown, the same team list, and the same scheduled time.",
  },
  {
    icon: Sparkles,
    title: "Watch it drawn live",
    body: "At zero, the randomizer fires. Picks reveal one at a time for the whole league. Seed and timestamps stay public forever.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-sideline/50">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-signal">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-chalk sm:text-5xl">
            Three steps. <span className="text-signal">No commish secrets.</span>
          </h2>
          <p className="mt-4 text-hashmark">
            Nobody runs the draft in private and emails you a screenshot. Everything happens in front of the whole league.
          </p>
        </div>
        <ol className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="group relative overflow-hidden rounded-2xl border border-sideline/50 bg-sideline/20 p-6 transition-colors hover:border-signal/30 hover:bg-sideline/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-signal/10 ring-1 ring-signal/30">
                  <step.icon className="size-5 text-signal" />
                </div>
                <span className="font-mono text-xs font-medium text-signal">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-chalk">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-hashmark">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
