import Link from "next/link";
import { GithubIcon } from "@/components/icons/github";
import { BrandMark } from "@/components/brand-mark";

const GITHUB_URL = "https://github.com/fantasy-draft-order/fantasy-draft-order";

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
  { href: "/new", label: "Create a draft" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/why-fair", label: "Why it's fair" },
  { href: "/draft-lottery", label: "Draft lottery" },
  { href: "/guides", label: "Guides" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-50 border-b border-sideline/50 bg-midnight/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-base font-bold tracking-tight text-chalk sm:text-lg">
              Fantasy Draft Order
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm sm:flex">
            <Link
              href="/how-it-works"
              className="text-hashmark transition-colors hover:text-chalk"
            >
              How it works
            </Link>
            <Link
              href="/why-fair"
              className="text-hashmark transition-colors hover:text-chalk"
            >
              Why it&apos;s fair
            </Link>
            <Link
              href="/guides"
              className="text-hashmark transition-colors hover:text-chalk"
            >
              Guides
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-hashmark transition-colors hover:text-chalk"
            >
              <GithubIcon className="size-4" />
              GitHub
            </a>
          </nav>
          <Link
            href="/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-signal px-4 text-sm font-semibold text-midnight transition-colors hover:bg-signal-dark"
          >
            Start a draft
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-auto border-t border-sideline/50 bg-midnight py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <BrandMark />
                <span className="font-display text-base font-bold tracking-tight text-chalk">
                  Fantasy Draft Order
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-hashmark">
                The draft order your league can actually trust. Free, open
                source, and trust-by-design.
              </p>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-hashmark transition-colors hover:text-chalk"
              >
                <GithubIcon className="size-3.5" />
                Source on GitHub
              </a>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-chalk">
                Product
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {PRODUCT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-hashmark transition-colors hover:text-chalk"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-chalk">
                Platforms
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {PLATFORM_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-hashmark transition-colors hover:text-chalk"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-chalk">
                Sports
              </h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {SPORT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-hashmark transition-colors hover:text-chalk"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-sideline/50 pt-6 text-xs text-hashmark sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} Fantasy Draft Order — no accounts,
              no tracking.
            </p>
            <p className="font-mono">Built with crypto.randomInt.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
