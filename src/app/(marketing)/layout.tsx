import Link from "next/link";
import { GithubIcon } from "@/components/icons/github";
import { BrandMark } from "@/components/brand-mark";
import { Wordmark } from "@/components/wordmark";

const GITHUB_URL = "https://github.com/Parra-Inc/fantasy-draft-order";

const PLATFORM_LINKS = [
  { href: "/sleeper", label: "Sleeper" },
  { href: "/espn", label: "ESPN" },
  { href: "/yahoo", label: "Yahoo" },
  { href: "/mfl", label: "MyFantasyLeague" },
  { href: "/fleaflicker", label: "Fleaflicker" },
];

const SPORT_LINKS = [
  { href: "/fantasy-football", label: "Fantasy football" },
  { href: "/fantasy-basketball", label: "Fantasy basketball" },
  { href: "/fantasy-baseball", label: "Fantasy baseball" },
  { href: "/fantasy-hockey", label: "Fantasy hockey" },
];

const PRODUCT_LINKS = [
  { href: "/new", label: "Schedule the draw" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/why-fair", label: "Why it's fair" },
  { href: "/ask-your-commissioner", label: "Ask your commissioner" },
  { href: "/draft-lottery", label: "Draft lottery" },
  { href: "/fantasy-football-punishments", label: "Punishments" },
  { href: "/fantasy-football-facebook-groups", label: "Facebook groups" },
  { href: "/guides", label: "Guides" },
  { href: "/league-id", label: "Find your league ID" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-sideline/50 bg-midnight/90 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark />
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            <Link
              href="/how-it-works"
              className="text-hashmark hover:text-chalk transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/why-fair"
              className="text-hashmark hover:text-chalk transition-colors"
            >
              Why it&apos;s fair
            </Link>
            <Link
              href="/guides"
              className="text-hashmark hover:text-chalk transition-colors"
            >
              Guides
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-hashmark hover:text-chalk flex items-center gap-1.5 transition-colors"
            >
              <GithubIcon className="size-4" />
              GitHub
            </a>
          </nav>
          <Link
            href="/new"
            className="bg-signal text-midnight hover:bg-signal-dark inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors"
          >
            Schedule the draw
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-sideline/50 bg-midnight mt-auto border-t py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <BrandMark />
                <Wordmark />
              </Link>
              <p className="text-hashmark mt-3 max-w-xs text-sm leading-relaxed">
                The draft order your league can actually trust. Free, open
                source, and trust-by-design.
              </p>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="text-hashmark hover:text-chalk mt-4 inline-flex items-center gap-1.5 text-xs transition-colors"
              >
                <GithubIcon className="size-3.5" />
                Source on GitHub
              </a>
            </div>
            <div>
              <h4 className="font-display text-chalk text-sm font-bold">
                Product
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {PRODUCT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-hashmark hover:text-chalk transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display text-chalk text-sm font-bold">
                Platforms
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {PLATFORM_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-hashmark hover:text-chalk transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display text-chalk text-sm font-bold">
                Sports
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {SPORT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-hashmark hover:text-chalk transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-sideline/50 text-hashmark mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} Fantasy Football Draft Order. No
              accounts, no tracking.
            </p>
            <p className="font-mono">Built with crypto.randomInt.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
