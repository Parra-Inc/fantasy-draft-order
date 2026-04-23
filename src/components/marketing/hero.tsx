import Link from "next/link";
import { ArrowRight, Shield, Trophy } from "lucide-react";
import { GithubIcon } from "@/components/icons/github";

const GITHUB_URL = "https://github.com/fantasy-draft-order/fantasy-draft-order";

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
        <div className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-signal/10 blur-[120px]" />
        <div className="absolute top-40 left-1/4 h-[400px] w-[400px] rounded-full bg-signal/5 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/5 px-4 py-1.5 text-xs font-medium text-signal">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
            </span>
            Open source · No accounts · Free forever
          </div>

          <h1 className="mt-8 font-display text-5xl font-bold tracking-tight text-chalk sm:text-6xl lg:text-7xl">
            The draft order your{" "}
            <span className="text-signal">league can trust.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-hashmark">
            Set a time. Share a link. Your whole league watches the order drawn
            live — from open-source code that nobody can tamper with.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/new"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-signal px-7 font-semibold text-midnight shadow-lg shadow-signal/20 transition-colors hover:bg-signal-dark"
            >
              Create a draft
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-sideline px-6 font-semibold text-chalk transition-colors hover:bg-sideline/50"
            >
              <GithubIcon className="size-4" />
              View on GitHub
            </a>
          </div>

          <p className="mt-6 text-xs text-hashmark/70">
            Free to use. Under a minute to set up. No credit card ever.
          </p>
        </div>

        {/* Mock draft board preview */}
        <div className="relative mx-auto mt-16 max-w-3xl">
          <div className="rounded-2xl border border-sideline/50 bg-sideline/30 p-2 shadow-2xl shadow-signal/5 backdrop-blur-sm">
            <div className="overflow-hidden rounded-xl bg-midnight/80">
              {/* Mock header */}
              <div className="flex items-center justify-between border-b border-sideline/40 px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal/10 ring-1 ring-signal/30">
                    <Trophy className="h-3.5 w-3.5 text-signal" />
                  </div>
                  <div>
                    <p className="font-display text-xs font-bold text-chalk">
                      Thursday Night League
                    </p>
                    <p className="text-[10px] text-hashmark">
                      10 teams · Drawing live
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 px-2.5 py-1">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
                  </span>
                  <span className="font-mono text-[10px] font-medium text-signal">
                    LIVE
                  </span>
                </div>
              </div>

              {/* Draft order rows */}
              <div className="divide-y divide-sideline/30">
                {MOCK_PICKS.map((p) => (
                  <MockRow key={p.pick} {...p} />
                ))}
                <div className="flex items-center gap-3 px-5 py-3">
                  <span className="w-6 text-right font-mono text-xs text-hashmark">
                    6
                  </span>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="size-7 rounded-full border border-dashed border-hashmark/40" />
                    <div className="flex items-center gap-1.5 text-xs text-hashmark">
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-signal" />
                      </span>
                      Drawing next pick…
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-hashmark/70">
                    seed: d8f…
                  </span>
                </div>
              </div>

              {/* Trust footer */}
              <div className="flex items-center justify-between border-t border-sideline/40 bg-sideline/20 px-5 py-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-hashmark">
                  <Shield className="h-3 w-3 text-signal" />
                  Fisher–Yates · crypto.randomInt
                </div>
                <span className="font-mono text-[10px] text-hashmark">
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
      <span className="w-6 text-right font-mono text-xs text-hashmark">
        {pick}
      </span>
      <div className="flex size-7 items-center justify-center rounded-full bg-signal/15 text-[10px] font-bold text-signal ring-1 ring-signal/30">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-chalk">{team}</p>
        <p className="truncate text-[10px] text-hashmark">{owner}</p>
      </div>
      <span className="font-mono text-[10px] text-hashmark/60">
        pck_{pick.toString().padStart(3, "0")}
      </span>
    </div>
  );
}
