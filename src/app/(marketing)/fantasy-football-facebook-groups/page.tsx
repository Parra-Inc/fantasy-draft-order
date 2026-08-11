import Link from "next/link";
import { ArrowRight, MessageSquare, Search, Users } from "lucide-react";
import { FinalCta } from "@/components/marketing/cta";
import { buildMetadata } from "@/lib/seo/metadata";
import { BreadcrumbLd, FaqLd, ItemListLd } from "@/lib/seo/jsonld";

/**
 * A roundup of the fantasy football Facebook groups worth joining.
 *
 * The reason this page can rank at all is that group content is behind a
 * login, so Google indexes the group shells and nothing inside them. Every
 * competing roundup is therefore working from the same blind spot we are, and
 * most of them paper over it with member counts copied from each other years
 * ago. We do not print a single membership number anywhere on this page: the
 * logged-out web cannot see them, so any figure here would be a guess wearing
 * a suit. Names and links were checked by hand on the date below.
 *
 * The editorial job is the second half of the page, not the list. A league
 * that outsources its draft order to a Facebook poll has replaced one
 * unverifiable process with a worse one, and that is the argument this page
 * exists to make.
 */

const CHECKED_ON = "August 10, 2026";

export const metadata = buildMetadata({
  title: "The Best Fantasy Football Facebook Groups (2026)",
  description:
    "The fantasy football Facebook groups worth joining, what each one is actually for, how to find a league that will not fold by week six, and which league decisions you should never put to a group vote.",
  path: "/fantasy-football-facebook-groups",
  keywords: [
    "fantasy football facebook groups",
    "best fantasy football groups",
    "fantasy football league finder",
    "find a fantasy football league",
    "dynasty fantasy football facebook group",
    "fantasy football community",
  ],
});

const GROUPS = [
  {
    name: "Fantasy Football League Finder",
    href: "https://www.facebook.com/groups/fantasyfootballleaguefinder/",
    role: "Finding a league",
    body: "The clearing house for open spots. If you are short a manager or looking for a seat, this is the highest-traffic place to post in August. It is also where you will meet the single biggest risk in public leagues, which is a stranger who drafts enthusiastically and stops setting a lineup in week four.",
  },
  {
    name: "DynastyNerds.com Dynasty Fantasy Football Community",
    href: "https://www.facebook.com/groups/dynastynerds/",
    role: "Dynasty and keeper",
    body: "Dynasty is a different game with a different vocabulary, and general groups handle it badly. This one is attached to a long-running dynasty content brand, so the discussion assumes you know what a rookie pick is worth and moves on from there. Best room for startup draft strategy and trade valuation.",
  },
  {
    name: "Fantasy Football Advice!",
    href: "https://www.facebook.com/groups/479438029370708/",
    role: "In-season decisions",
    body: "Start/sit, waiver priorities, and trade sanity checks, at volume, all season. Useful for exactly one thing: finding out fast whether your read on a player is the consensus or the contrarian one. Do not expect the crowd to be right, expect it to tell you where the crowd is.",
  },
];

const FAQS = [
  {
    q: "What is the best Facebook group for finding a fantasy football league?",
    a: "Fantasy Football League Finder is the busiest place to find open spots, particularly in the weeks before the season. The harder problem is not finding a league but finding one that finishes: ask how many of last year's managers are returning, whether there is a buy-in, and what happens to an abandoned team before you accept a seat.",
  },
  {
    q: "Why can't I read fantasy football group posts from Google?",
    a: "Facebook group content sits behind a login, so search engines never index the discussion inside. The groups are findable, the conversation is not, which is why lists like this one exist at all.",
  },
  {
    q: "Should my league decide the draft order in a Facebook group poll?",
    a: "No. A poll decides what people want, which is the opposite of what a draft order is for. It also runs in a feed that the poll creator controls, so it is even less checkable than a commissioner clicking randomize in private. If the goal is a fair order, draw it at a time announced in advance with a link everybody has beforehand.",
  },
  {
    q: "Are Facebook groups better than Reddit for fantasy football?",
    a: "Reddit is better for research, because threads are public and searchable years later. Facebook groups are better for finding leagues and league mates, because there are real identities attached and a commissioner can see who they are inviting. Most people use Reddit to think and Facebook to recruit.",
  },
  {
    q: "How do I avoid joining a league that falls apart?",
    a: "Ask three questions before you accept: how long has this league existed, how many managers are returning from last season, and is there money in escrow. A league in its fourth year with nine returning managers and a paid buy-in almost never collapses. A brand new free league recruiting twelve strangers in August frequently does.",
  },
];

export default function FantasyFootballFacebookGroupsPage() {
  return (
    <>
      <BreadcrumbLd
        items={[
          { name: "Home", path: "/" },
          {
            name: "Fantasy football Facebook groups",
            path: "/fantasy-football-facebook-groups",
          },
        ]}
      />
      <FaqLd faqs={FAQS} />
      <ItemListLd
        name="The best fantasy football Facebook groups"
        path="/fantasy-football-facebook-groups"
        items={GROUPS.map((g) => ({ name: g.name, url: g.href }))}
      />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="bg-signal/5 absolute top-0 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
            Checked {CHECKED_ON}
          </p>
          <h1 className="font-display text-chalk mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
            The fantasy football groups worth joining.
          </h1>
          <p className="text-hashmark mt-5 text-lg leading-relaxed">
            Facebook groups are where leagues actually get filled. They are also
            where the worst league-governance ideas on the internet get
            workshopped, usually in a poll. Here are the rooms worth your time,
            and the decisions you should keep out of them.
          </p>
          <p className="text-hashmark mt-4 text-sm leading-relaxed">
            One note on the numbers you will not find here. Every other roundup
            of these groups lists member counts. Facebook does not show member
            counts to anyone who is not logged in, so those figures are copied
            between articles and go stale without anyone noticing. We checked
            the names and links by hand and left the numbers out. We are not
            affiliated with any of these groups and do not moderate them.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <ul className="space-y-4">
          {GROUPS.map((g) => (
            <li
              key={g.href}
              className="border-sideline/50 bg-sideline/20 rounded-2xl border p-6"
            >
              <p className="text-signal font-mono text-xs tracking-wider uppercase">
                {g.role}
              </p>
              <h2 className="font-display text-chalk mt-2 text-xl font-bold tracking-tight">
                {g.name}
              </h2>
              <p className="text-hashmark mt-2 text-sm leading-relaxed">
                {g.body}
              </p>
              <a
                href={g.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-signal mt-4 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
              >
                Open the group
                <ArrowRight className="size-3.5" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h2 className="font-display text-chalk text-2xl font-bold tracking-tight sm:text-3xl">
          Finding a league that survives to week six
        </h2>
        <p className="text-hashmark mt-4 leading-relaxed">
          The failure mode of a public league is not cheating, it is
          abandonment. Half a roster stops setting lineups by October and the
          playoff race turns into a lottery over who played the dead teams. The
          questions that predict this are boring and nobody asks them.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Point
            icon={Users}
            title="How many are returning?"
            body="Nine of twelve coming back is a real league. Twelve strangers recruited in August is a coin flip."
          />
          <Point
            icon={MessageSquare}
            title="Is there a buy-in?"
            body="Money in escrow is the cheapest anti-abandonment device ever invented. Free leagues die quietly."
          />
          <Point
            icon={Search}
            title="What are the orphan rules?"
            body="Ask what happens to an abandoned team mid-season. A league with a written answer has been burned before and fixed it."
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h2 className="font-display text-chalk text-2xl font-bold tracking-tight sm:text-3xl">
          What not to put to the group
        </h2>
        <p className="text-hashmark mt-4 leading-relaxed">
          Groups are good at telling you what most managers do. That makes them
          useful for settling a rules debate where the answer is genuinely a
          matter of taste, like whether to run a superflex or how deep the
          playoff field should be.
        </p>
        <p className="text-hashmark mt-4 leading-relaxed">
          They are actively bad at anything that needs to be verifiable rather
          than popular. The clearest case is the draft order. Every August
          somebody suggests settling it with a poll, or posts a screenshot of a
          randomizer result, and neither of those is evidence of anything. A
          poll measures preference. A screenshot shows one result from a tool
          that can be run repeatedly in private until the result is convenient.
        </p>
        <p className="text-hashmark mt-4 leading-relaxed">
          The fix is not an accusation against your commissioner. It is a time,
          a link, and everyone looking at the same screen at once. If you are
          the one who has to raise it, we wrote{" "}
          <Link
            href="/ask-your-commissioner"
            className="text-signal hover:underline"
          >
            the script for that conversation
          </Link>
          . If your league prefers weighting the odds toward last year&apos;s
          worst teams, a{" "}
          <Link href="/draft-lottery" className="text-signal hover:underline">
            draft lottery
          </Link>{" "}
          does that without giving anyone a button to press twice.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h2 className="font-display text-chalk text-2xl font-bold tracking-tight sm:text-3xl">
          Group etiquette
        </h2>
        <ul className="text-hashmark mt-6 space-y-3 text-sm leading-relaxed">
          <li>
            Read the pinned rules before posting. Most league-finder groups
            require a set format, and posts that ignore it get removed rather
            than filled.
          </li>
          <li>
            Post your league once. The same recruitment post pasted into six
            groups in an hour reads as spam in all six.
          </li>
          <li>
            Give real details when recruiting: platform, scoring, buy-in,
            draft date, and how long the league has run. Vague posts attract
            exactly the managers who will disappear.
          </li>
          <li>
            Do not post league invite links publicly if the league has money in
            it. Vet people first, in the thread or by message.
          </li>
          <li>
            Answer a few start/sit questions before you ask one. It is the
            fastest way to be recognized in a group of that size.
          </li>
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <h2 className="font-display text-chalk text-2xl font-bold tracking-tight sm:text-3xl">
          Common questions
        </h2>
        <dl className="mt-6 space-y-5">
          {FAQS.map((faq) => (
            <div
              key={faq.q}
              className="border-sideline/50 bg-sideline/20 rounded-2xl border p-5 sm:p-6"
            >
              <dt className="font-display text-chalk font-bold">{faq.q}</dt>
              <dd className="text-hashmark mt-2 text-sm leading-relaxed">
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>

        <div className="border-signal/30 bg-signal/5 mt-10 rounded-2xl border p-6 sm:p-8">
          <h3 className="font-display text-chalk text-xl font-bold sm:text-2xl">
            Found your league? Draw the order in public.
          </h3>
          <p className="text-hashmark mt-2 text-sm leading-relaxed">
            Schedule the draw, share the link with the group before it fires,
            and nobody has to take anybody&apos;s word for the result. Free, no
            accounts, no tracking.
          </p>
          <Link
            href="/new?src=FACEBOOK_GROUPS"
            className="bg-signal text-midnight hover:bg-signal-dark shadow-signal/20 mt-5 inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold shadow-lg transition-colors"
          >
            Schedule the draw
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <FinalCta />
    </>
  );
}

function Point({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="border-sideline/50 bg-sideline/20 rounded-2xl border p-5">
      <Icon className="text-signal size-5" />
      <h3 className="font-display text-chalk mt-3 font-bold">{title}</h3>
      <p className="text-hashmark mt-1.5 text-sm leading-relaxed">{body}</p>
    </div>
  );
}
