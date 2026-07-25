const PLATFORMS = [
  { name: "Sleeper", note: "Paste league ID" },
  { name: "MyFantasyLeague", note: "Paste league ID" },
  { name: "Fleaflicker", note: "Paste league ID" },
  { name: "ESPN", note: "Public leagues" },
  { name: "Manual", note: "Type team names" },
];

export function Integrations({ highlight }: { highlight?: string }) {
  return (
    <section className="border-sideline/50 border-t">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
            Integrations
          </p>
          <h2 className="font-display text-chalk mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Bring your league as-is.
          </h2>
          <p className="text-hashmark mt-4">
            Paste a league ID and we pull in your teams, owners, and avatars.
          </p>
          <p className="text-chalk mt-3 font-medium">
            No login, no OAuth, nothing written back to your league.
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
                <p className="text-hashmark mt-1 text-xs">{p.note}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
