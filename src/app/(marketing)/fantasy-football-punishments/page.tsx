import Link from "next/link";
import { PunishmentPicker } from "@/components/marketing/punishment-picker";
import { CATEGORY_BLURBS, listApprovedIdeas } from "@/lib/punishments";
import { FaqLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

/**
 * The punishment ideas database, and the top of the funnel for /punishment/new.
 *
 * UNLIKE EVERY OTHER MARKETING PAGE, this one is force-dynamic. It reads
 * PunishmentIdea from D1 so that approving a submission publishes it with no
 * redeploy, and the D1 binding only exists inside a request — making this
 * static would fail the build, not just serve stale content. Do not "optimise"
 * it back to a prerender without first moving the ideas back into git.
 */
export const dynamic = "force-dynamic";

const FAQS = [
  {
    q: "What is a good fantasy football punishment?",
    a: "One that is embarrassing rather than harmful, has a clear end, and can be proved with a photo. The best ones are agreed at the start of the season, before anyone knows who will be serving them, and are drawn rather than chosen so nobody can argue the commissioner picked favourites.",
  },
  {
    q: "How do you pick the punishment fairly?",
    a: "Put every candidate on a wheel, schedule the draw, and share the link before it fires. The result here is drawn server-side from a recorded seed the moment the wheel is created and cannot be seen by anyone — including whoever made it — until the scheduled time. There is no re-spin button.",
  },
  {
    q: "When should the league decide the punishment?",
    a: "At the draft, for the season that is about to start. Deciding after the standings are final is how leagues end up arguing, because by then everyone knows who they are voting against.",
  },
  {
    q: "Can I add my own punishments?",
    a: "Yes. The list here is a starting point: pick any of them with the plus button, then add your own on the next screen. You can also submit an idea for this page, which gets read by a human before it appears.",
  },
  {
    q: "Is this free?",
    a: "Yes. No accounts, no paywalls, no ads. The randomizer is open source and every drawn result links the exact code that produced it.",
  },
];

export const metadata = buildMetadata({
  title: "Fantasy Football Punishments: 40+ Ideas and a Fair Way to Draw One",
  description:
    "A running list of fantasy football last-place punishments, from cheap and silly to genuinely permanent. Pick the ones your league would actually do, then draw one publicly so nobody can accuse the commissioner of rigging it.",
  path: "/fantasy-football-punishments",
});

export default async function PunishmentsPage() {
  const groups = await listApprovedIdeas();
  const total = groups.reduce((n, g) => n + g.ideas.length, 0);

  return (
    <>
      <FaqLd faqs={FAQS} />
      <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="font-display text-signal text-xs font-bold tracking-[0.2em] uppercase">
          Last place
        </p>
        <h1 className="font-display text-chalk mt-4 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
          Fantasy football punishments.{" "}
          <span className="text-signal">Drawn, not chosen.</span>
        </h1>
        <p className="text-hashmark mt-5 max-w-prose text-lg leading-relaxed">
          {total} ideas your league might actually go through with, sorted by
          how much they hurt. Tap the plus on the ones you like, then draw one
          publicly at a time everybody agrees on — so the loser cannot claim the
          commissioner went easy on their friend.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/punishment/new?src=PUNISHMENT_IDEAS"
            className="bg-signal text-midnight hover:bg-signal-dark inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold transition-colors"
          >
            Build a wheel from scratch
          </Link>
          <Link
            href="/new"
            className="border-sideline text-chalk hover:border-signal/50 inline-flex h-11 items-center rounded-xl border px-5 text-sm font-semibold transition-colors"
          >
            Randomize a draft order instead
          </Link>
        </div>

        <section className="border-sideline/50 bg-sideline/10 mt-12 rounded-2xl border p-6">
          <h2 className="font-display text-chalk text-lg font-bold">
            Decide the punishment before the season, not after
          </h2>
          <p className="text-hashmark mt-2 max-w-prose text-sm leading-relaxed">
            Every league argument about punishments has the same root cause:
            the list was written once somebody already knew who would be
            serving it. Agree the options at the draft, lock them in, and let a
            public draw pick the one. The wheel here seals its answer the second
            it is created and will not show it to anyone, including its creator,
            until the time you set.
          </p>
        </section>

        <div className="mt-14">
          {groups.length === 0 ? (
            <p className="text-hashmark text-sm">
              No punishments have been published yet. Check back shortly.
            </p>
          ) : (
            <>
              <div className="mb-12 flex flex-col gap-6">
                {groups.map((group) => (
                  <div key={group.category}>
                    <h3 className="font-display text-chalk text-sm font-bold">
                      {group.label}
                      <span className="text-hashmark ml-2 font-mono text-xs font-normal">
                        {group.ideas.length}
                      </span>
                    </h3>
                    <p className="text-hashmark mt-1 max-w-prose text-sm">
                      {CATEGORY_BLURBS[group.category]}
                    </p>
                  </div>
                ))}
              </div>
              <PunishmentPicker groups={groups} />
            </>
          )}
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
      </div>
    </>
  );
}
