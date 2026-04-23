import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { buildMetadata } from "@/lib/seo/metadata";
import { BreadcrumbLd } from "@/lib/seo/jsonld";
import { NewDraftForm } from "./new-draft-form";

export const metadata = buildMetadata({
  title: "Schedule a Fantasy Draft Order",
  description:
    "Set up a fair, transparent fantasy draft order in under a minute. Pick a time, add your teams or import your league, and share one link. The draw fires live for the whole league.",
  path: "/new",
  keywords: [
    "schedule fantasy draft order",
    "create fantasy draft order",
    "fantasy draft order randomizer",
  ],
});

export default function NewDraftPage() {
  return (
    <div className="flex min-h-full flex-col">
      <BreadcrumbLd
        items={[
          { name: "Home", path: "/" },
          { name: "Schedule a draft", path: "/new" },
        ]}
      />
      <header className="border-b border-sideline/50 bg-midnight/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-base font-bold tracking-tight text-chalk sm:text-lg">
              Fantasy Draft Order
            </span>
          </Link>
        </div>
      </header>
      <main className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-signal/5 blur-[120px]" />
        </div>
        <div className="relative mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-hashmark transition-colors hover:text-chalk"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <div className="mb-8">
            <p className="font-mono text-xs font-medium uppercase tracking-wider text-signal">
              New draft
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-chalk sm:text-5xl">
              Set up your draw.
            </h1>
            <p className="mt-3 text-hashmark">
              Once scheduled, your draft cannot be edited. Share the link with your league.
            </p>
          </div>
          <NewDraftForm />
        </div>
      </main>
    </div>
  );
}
