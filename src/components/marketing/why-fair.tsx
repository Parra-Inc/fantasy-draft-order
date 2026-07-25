import { Code2, Eye, Clock, Lock } from "lucide-react";

const PILLARS = [
  {
    icon: Code2,
    title: "Open source, on purpose",
    body: "Every line of the randomizer lives on GitHub. Each draft links to the exact commit that picked it, so you can read the code yourself.",
  },
  {
    icon: Eye,
    title: "Everyone watches together",
    body: "No one runs the draw in private and emails a screenshot. The whole league sees the same animation at the same moment.",
  },
  {
    icon: Lock,
    title: "Frozen the second you schedule it",
    body: "Teams and time lock the moment you create the draft. The commissioner cannot edit, re-run, or re-roll it, because there is no button that does that.",
  },
  {
    icon: Clock,
    title: "The receipts never expire",
    body: "Every draft's URL keeps the seed, the start and finish timestamps, and the source commit. Open it next season and it still adds up.",
  },
];

export function WhyFair() {
  return (
    <section
      id="trust"
      className="border-sideline/50 bg-sideline/10 scroll-mt-20 border-y"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
            Why it&apos;s fair
          </p>
          <h2 className="font-display text-chalk mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Every other randomizer asks you to trust the person running it.{" "}
            <span className="text-signal">We took that person out.</span>
          </h2>
          <p className="text-hashmark mt-4">
            Trust here is not a promise on a marketing page. It is four things
            you can check yourself.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="border-sideline/50 bg-midnight/60 hover:border-signal/30 rounded-2xl border p-6 transition-colors"
            >
              <div className="bg-signal/10 text-signal ring-signal/30 inline-flex size-11 items-center justify-center rounded-xl ring-1">
                <p.icon className="size-5" />
              </div>
              <h3 className="font-display text-chalk mt-5 text-xl font-bold">
                {p.title}
              </h3>
              <p className="text-hashmark mt-2 text-sm leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
