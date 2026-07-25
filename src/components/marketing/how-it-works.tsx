import { Calendar, Link2, Sparkles } from "lucide-react";

const STEPS: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  note?: string;
}[] = [
  {
    icon: Calendar,
    title: "Schedule the draw",
    body: "Paste a league ID or type your teams in. Pick a date and time.",
    note: "Sleeper · MyFantasyLeague · Fleaflicker · ESPN · manual",
  },
  {
    icon: Link2,
    title: "Share the link",
    body: "Everyone sees the same synchronized countdown, the same team list, and the same scheduled time.",
  },
  {
    icon: Sparkles,
    title: "Watch it drawn live",
    body: "At zero the randomizer fires on the server. Picks land one at a time for everyone at once, and the seed and timestamps stay public forever.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-sideline/50 scroll-mt-20 border-t">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
            How it works
          </p>
          <h2 className="font-display text-chalk mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Three steps.{" "}
            <span className="text-signal">No commish secrets.</span>
          </h2>
          <p className="text-hashmark mt-4">
            Nobody runs the draft in private and emails you a screenshot.
            Everything happens in front of the whole league.
          </p>
        </div>
        <ol className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="group border-sideline/50 bg-sideline/20 hover:border-signal/30 hover:bg-sideline/30 relative overflow-hidden rounded-2xl border p-6 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-signal/10 ring-signal/30 flex size-11 items-center justify-center rounded-xl ring-1">
                  <step.icon className="text-signal size-5" />
                </div>
                <span className="text-signal font-mono text-xs font-medium">
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-display text-chalk mt-5 text-xl font-bold">
                {step.title}
              </h3>
              <p className="text-hashmark mt-2 text-sm leading-relaxed">
                {step.body}
              </p>
              {step.note && (
                <p className="text-hashmark/60 mt-3 font-mono text-[11px]">
                  {step.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
