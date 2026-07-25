import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Wordmark } from "@/components/wordmark";
import { toEntrySource } from "@/lib/db-enums";
import { resolveIdeaLabels } from "@/lib/punishments";
import { BreadcrumbLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";
import { NewPunishmentForm } from "./new-punishment-form";

/**
 * Resolves `?ideas=` against the database, so it cannot be prerendered: the D1
 * binding only exists inside a request.
 */
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Punishment Wheel: Draw a Fantasy Football Last-Place Punishment",
  description:
    "Build a punishment wheel for your fantasy league. Add the candidates, pick a time, share one link. The result is sealed the moment you create it and revealed publicly at the time you set, so nobody can accuse the commissioner of picking.",
  path: "/punishment/new",
  keywords: [
    "fantasy football punishment wheel",
    "fantasy football punishment generator",
    "last place punishment randomizer",
    "fantasy loser punishment picker",
    "punishment spinner",
  ],
});

export default async function NewPunishmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const ideasParam =
    typeof params.ideas === "string" ? params.ideas : undefined;
  const srcParam = typeof params.src === "string" ? params.src : undefined;

  // Unknown or since-rejected ids are dropped rather than erroring: a shortlist
  // link can easily outlive the ideas it points at.
  const initialOptions = await resolveIdeaLabels(ideasParam);

  return (
    <div className="flex min-h-full flex-col">
      <BreadcrumbLd
        items={[
          { name: "Home", path: "/" },
          { name: "Punishments", path: "/fantasy-football-punishments" },
          { name: "New wheel", path: "/punishment/new" },
        ]}
      />
      <header className="border-sideline/50 bg-midnight/90 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark />
            <Wordmark />
          </Link>
          <Link
            href="/fantasy-football-punishments"
            className="text-hashmark hover:text-chalk inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" />
            Browse ideas
          </Link>
        </div>
      </header>

      <main className="relative flex-1">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-signal/5 absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full blur-[120px]" />
        </div>
        <div className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <h1 className="font-display text-chalk text-3xl font-extrabold tracking-tight sm:text-4xl">
            Build the punishment wheel
          </h1>
          <p className="text-hashmark mt-3 max-w-prose text-sm leading-relaxed">
            {initialOptions.length > 0
              ? `${initialOptions.length} punishment${initialOptions.length === 1 ? "" : "s"} carried over. Edit them, add your own, then set a time.`
              : "Add the punishments your league agreed on, set a time, and share the link. The answer is drawn and sealed the second you create it."}
          </p>

          <div className="mt-8">
            <NewPunishmentForm
              initialOptions={initialOptions}
              entrySource={toEntrySource(srcParam)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
