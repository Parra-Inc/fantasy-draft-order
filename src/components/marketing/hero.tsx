import Link from "next/link";
import { Shield, Trophy } from "lucide-react";
import { GithubIcon } from "@/components/icons/github";
import { LeagueIdForm } from "@/components/marketing/league-id-form";

const GITHUB_URL = "https://github.com/Parra-Inc/fantasy-draft-order";

const MOCK_PICKS = [
  { pick: 1, team: "Gridiron Goons", owner: "Marcus" },
  { pick: 2, team: "Blitz Brigade", owner: "Jordan" },
  { pick: 3, team: "Red Zone Royals", owner: "Priya" },
  { pick: 4, team: "The Audibles", owner: "Sam" },
  { pick: 5, team: "Hail Mary Inc.", owner: "Alex" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Signal glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-signal/10 absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full blur-[120px]" />
        <div className="bg-signal/5 absolute top-40 left-1/4 h-[400px] w-[400px] rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="border-signal/30 bg-signal/5 text-signal inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium">
            <span className="relative flex size-1.5">
              <span className="bg-signal absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-signal relative inline-flex size-1.5 rounded-full" />
            </span>
            Open source · No accounts · Free forever
          </div>

          <h1 className="font-display text-chalk mt-8 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            The draft order your{" "}
            <span className="text-signal">league can trust.</span>
          </h1>

          <p className="text-hashmark mx-auto mt-6 max-w-xl text-lg leading-relaxed">
            The only draft order randomizer that shows its work: open code, a
            public seed, and a live draw your whole league watches together.
          </p>

          <LeagueIdForm />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <Link
              href="/new?tab=manual"
              className="text-chalk decoration-hashmark/40 hover:text-signal hover:decoration-signal/60 font-medium underline underline-offset-4 transition-colors"
            >
              Or type your teams in by hand
            </Link>
            <span className="text-hashmark/40">·</span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-hashmark hover:text-chalk inline-flex items-center gap-1.5 transition-colors"
            >
              <GithubIcon className="size-3.5" />
              View on GitHub
            </a>
          </div>

          <p className="text-hashmark/70 mt-6 text-xs">
            Free forever. Set up in under a minute. No account, no credit card.
          </p>
        </div>

        {/* Mock draft board preview */}
        <div className="relative mx-auto mt-16 max-w-3xl">
          <div className="border-sideline/50 bg-sideline/30 shadow-signal/5 rounded-2xl border p-2 shadow-2xl backdrop-blur-sm">
            <div className="bg-midnight/80 overflow-hidden rounded-xl">
              {/* Mock header */}
              <div className="border-sideline/40 flex items-center justify-between border-b px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="bg-signal/10 ring-signal/30 flex h-7 w-7 items-center justify-center rounded-lg ring-1">
                    <Trophy className="text-signal h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-display text-chalk text-xs font-bold">
                      Thursday Night League
                    </p>
                    <p className="text-hashmark text-[10px]">
                      10 teams · Drawing live
                    </p>
                  </div>
                </div>
                <div className="border-signal/30 bg-signal/10 flex items-center gap-1.5 rounded-full border px-2.5 py-1">
                  <span className="relative flex size-1.5">
                    <span className="bg-signal absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                    <span className="bg-signal relative inline-flex size-1.5 rounded-full" />
                  </span>
                  <span className="text-signal font-mono text-[10px] font-medium">
                    LIVE
                  </span>
                </div>
              </div>

              {/* Draft order rows */}
              <div className="divide-sideline/30 divide-y">
                {MOCK_PICKS.map((p) => (
                  <MockRow key={p.pick} {...p} />
                ))}
                <div className="flex items-center gap-3 px-5 py-3">
                  <span className="text-hashmark w-6 text-right font-mono text-xs">
                    6
                  </span>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="border-hashmark/40 size-7 rounded-full border border-dashed" />
                    <div className="text-hashmark flex items-center gap-1.5 text-xs">
                      <span className="relative flex size-1.5">
                        <span className="bg-signal absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                        <span className="bg-signal relative inline-flex size-1.5 rounded-full" />
                      </span>
                      Drawing next pick…
                    </div>
                  </div>
                  <span className="text-hashmark/70 font-mono text-[10px]">
                    seed: d8f…
                  </span>
                </div>
              </div>

              {/* Trust footer */}
              <div className="border-sideline/40 bg-sideline/20 flex items-center justify-between border-t px-5 py-2.5">
                <div className="text-hashmark flex items-center gap-1.5 text-[10px]">
                  <Shield className="text-signal h-3 w-3" />
                  Fisher–Yates · crypto.randomInt
                </div>
                <span className="text-hashmark font-mono text-[10px]">
                  randomizer.ts@a1b2c3d
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockRow({
  pick,
  team,
  owner,
}: {
  pick: number;
  team: string;
  owner: string;
}) {
  const initials = team
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span className="text-hashmark w-6 text-right font-mono text-xs">
        {pick}
      </span>
      <div className="bg-signal/15 text-signal ring-signal/30 flex size-7 items-center justify-center rounded-full text-[10px] font-bold ring-1">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-chalk truncate text-xs font-semibold">{team}</p>
        <p className="text-hashmark truncate text-[10px]">{owner}</p>
      </div>
      <span className="text-hashmark/60 font-mono text-[10px]">
        pck_{pick.toString().padStart(3, "0")}
      </span>
    </div>
  );
}
