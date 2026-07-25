import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-signal/10 absolute bottom-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 translate-y-1/2 rounded-full blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
        <h2 className="font-display text-chalk text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          End the group chat
          <br />
          <span className="text-signal">arguments.</span>
        </h2>
        <p className="text-hashmark mx-auto mt-6 max-w-xl text-lg">
          Schedule your league&apos;s draw in under a minute. No accounts, no
          credit card, no tracking.
        </p>
        <div className="mt-10 flex justify-center">
          <Link
            href="/new"
            className="bg-signal text-midnight shadow-signal/20 hover:bg-signal-dark inline-flex h-12 items-center gap-2 rounded-xl px-8 font-semibold shadow-lg transition-colors"
          >
            Schedule the draw
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <p className="text-hashmark/70 mt-4 text-sm">
          Free forever. Open source. No sign-up.
        </p>
      </div>
    </section>
  );
}
