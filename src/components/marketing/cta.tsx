import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 translate-y-1/2 rounded-full bg-signal/10 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
        <h2 className="font-display text-4xl font-bold tracking-tight text-chalk sm:text-5xl lg:text-6xl">
          End the group chat
          <br />
          <span className="text-signal">arguments.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-hashmark">
          Schedule your league&apos;s draft order in under a minute. No accounts, no credit card, no tracking.
        </p>
        <div className="mt-10 flex justify-center">
          <Link
            href="/new"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-signal px-8 font-semibold text-midnight shadow-lg shadow-signal/20 transition-colors hover:bg-signal-dark"
          >
            Create a draft
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <p className="mt-4 text-sm text-hashmark/70">
          Free forever. Open source. No sign-up.
        </p>
      </div>
    </section>
  );
}
