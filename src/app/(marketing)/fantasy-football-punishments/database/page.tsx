import Link from "next/link";
import { PunishmentTable } from "@/components/marketing/punishment-table";
import { toPunishmentCategory } from "@/lib/db-enums";
import { listApprovedRows, parseTags } from "@/lib/punishments";
import { BreadcrumbLd, FaqLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

/**
 * The full punishments database as one searchable, filterable table.
 *
 * Force-dynamic for the same reason as the parent page: rows live in D1 and
 * approving a submission must publish it with no redeploy. Every row is in the
 * server HTML, so the client-side filtering never hides content from crawlers.
 */
export const dynamic = "force-dynamic";

const FAQS = [
  {
    q: "What are the best fantasy football punishments?",
    a: "The ones a league will actually enforce. Filter by #Classic for the punishments most leagues already know (the Waffle House challenge, the rival jersey, the sign on a street corner), or by #Cheap and #One day if your league has never done one before.",
  },
  {
    q: "What is a fantasy football punishment that costs nothing?",
    a: "Filter by #Free. Most online punishments (the league picks your profile picture, writes your bio, or posts once from your account) and most endurance ones cost nothing but time and pride.",
  },
  {
    q: "Are there fantasy punishments for leagues that live in different cities?",
    a: "Yes. Filter by #Remote-friendly: anything provable with a photo or a video works for a league that only meets in a group chat.",
  },
  {
    q: "How do I use these with a punishment wheel?",
    a: "Tap the plus on two to 24 rows and press Spin these. You will land on the wheel builder with them filled in, schedule the draw, and share the link so the whole league watches the result arrive at the same time.",
  },
];

export const metadata = buildMetadata({
  title: "Fantasy Football Punishments Database",
  description:
    "Every fantasy football last-place punishment in one searchable table. Filter by cost, duration, remote-friendly and more, then spin your shortlist.",
  path: "/fantasy-football-punishments/database",
});

export default async function PunishmentDatabasePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; category?: string }>;
}) {
  const [rows, params] = await Promise.all([listApprovedRows(), searchParams]);

  return (
    <>
      <FaqLd faqs={FAQS} />
      <BreadcrumbLd
        items={[
          { name: "Home", path: "/" },
          { name: "Punishments", path: "/fantasy-football-punishments" },
          { name: "Database", path: "/fantasy-football-punishments/database" },
        ]}
      />
      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="font-display text-signal text-xs font-bold tracking-[0.2em] uppercase">
          <Link href="/fantasy-football-punishments" className="hover:underline">
            Punishments
          </Link>{" "}
          / Database
        </p>
        <h1 className="font-display text-chalk mt-4 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          The fantasy football punishments database
        </h1>
        <p className="text-hashmark mt-5 max-w-prose text-lg leading-relaxed">
          {rows.length} last-place punishments collected from leagues, forums
          and our own submissions. Search for anything, narrow by category or
          tag, and tick the ones your league would actually do. Two or more
          and you can put them on a wheel and draw one in public.
        </p>

        <div className="mt-10">
          <PunishmentTable
            rows={rows}
            initialTags={parseTags(params.tag)}
            initialCategory={toPunishmentCategory(params.category ?? null)}
          />
        </div>

        <section className="mt-16">
          <h2 className="font-display text-chalk text-2xl font-bold tracking-tight">
            Questions
          </h2>
          <dl className="mt-6 space-y-6">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <dt className="text-chalk font-semibold">{faq.q}</dt>
                <dd className="text-hashmark mt-1.5 max-w-prose text-sm leading-relaxed">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="text-hashmark mt-12 text-sm">
          Prefer the ideas grouped by how much they hurt?{" "}
          <Link
            href="/fantasy-football-punishments"
            className="text-signal hover:underline"
          >
            Browse the punishment ideas by category
          </Link>
          .
        </p>
      </div>
    </>
  );
}
