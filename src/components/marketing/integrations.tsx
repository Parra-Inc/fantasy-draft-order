const PLATFORMS = [
  { name: "Sleeper", note: "Paste league ID" },
  { name: "MyFantasyLeague", note: "Paste league ID" },
  { name: "Fleaflicker", note: "Paste league ID" },
  { name: "ESPN", note: "Public leagues" },
  { name: "Manual", note: "Type team names" },
];

export function Integrations({ highlight }: { highlight?: string }) {
  return (
    <section className="border-t border-sideline/50">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-signal">
            Integrations
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-chalk sm:text-5xl">
            Bring your league as-is.
          </h2>
          <p className="mt-4 text-hashmark">
            Paste a league ID, we&apos;ll fetch your teams, owners, and avatars. No OAuth dance, no account required.
          </p>
        </div>
        <ul className="mx-auto mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PLATFORMS.map((p) => {
            const isHighlighted = highlight && p.name === highlight;
            return (
              <li
                key={p.name}
                className={`group rounded-2xl border px-4 py-5 text-center transition-colors ${
                  isHighlighted
                    ? "border-signal/60 bg-signal/10"
                    : "border-sideline/50 bg-sideline/20 hover:border-signal/30 hover:bg-sideline/40"
                }`}
              >
                <p
                  className={`font-display text-base font-bold transition-colors ${
                    isHighlighted
                      ? "text-signal"
                      : "text-chalk group-hover:text-signal"
                  }`}
                >
                  {p.name}
                </p>
                <p className="mt-1 text-xs text-hashmark">{p.note}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
