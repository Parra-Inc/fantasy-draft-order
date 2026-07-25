import Link from "next/link";
import { ArrowRight, Eye, Lock, ShieldQuestion } from "lucide-react";
import { CommissionerAsk } from "@/components/marketing/commissioner-ask";
import { buildMetadata } from "@/lib/seo/metadata";
import { BreadcrumbLd, FaqLd } from "@/lib/seo/jsonld";

/**
 * The page for the person who is NOT the commissioner.
 *
 * Every other entry point in this app assumes you have the authority to run
 * the draw. This one assumes the opposite, which matters because the person
 * who wants a verifiable draft order most is rarely the person who currently
 * controls it. Its job is to convert that person into a distributor: they send
 * the message, and their commissioner creates the draft.
 */

export const metadata = buildMetadata({
  title: "How to Ask Your Commissioner for a Fair Draft Order",
  description:
    "You think the draft order should be drawn in public. Here is how to bring it up with your fantasy commissioner without starting a fight, plus a message you can paste straight into the league chat.",
  path: "/ask-your-commissioner",
  keywords: [
    "commissioner rigged draft order",
    "fantasy commissioner cheating",
    "fair fantasy draft order",
    "how to prove draft order was random",
    "verify fantasy draft order",
    "league voted draft order",
  ],
});

const FAQS = [
  {
    q: "Am I accusing my commissioner of cheating by asking for this?",
    a: "No, and it is worth saying so out loud when you bring it up. The argument is about process, not about a person: right now there is no way for anyone to show the draw was clean, including your commissioner. A public draw protects them from the accusation as much as it protects you from the outcome.",
  },
  {
    q: "Do I have to be the commissioner to set this up?",
    a: "No. There are no accounts and no roles. Anyone can schedule a draw, and the link works the same for everybody. The only thing that matters is that the whole league has the link before the scheduled time.",
  },
  {
    q: "What if my commissioner says the platform's randomizer is already fine?",
    a: "It probably is random. The problem is that it fires in private, on demand, and can be run more than once, so nobody outside the commissioner's screen can tell a first result from a fifth. A scheduled public draw removes the question rather than answering it.",
  },
  {
    q: "What actually stops someone gaming this tool the same way?",
    a: "Only one thing, and it is the thing to insist on: the link has to be shared before the draw time. Someone who creates several drafts and shares only the one they like has gamed it. Every draft page says so, and shows the scheduled time against when the link went out.",
  },
];

export default function AskYourCommissionerPage() {
  return (
    <>
      <BreadcrumbLd
        items={[
          { name: "Home", path: "/" },
          { name: "Ask your commissioner", path: "/ask-your-commissioner" },
        ]}
      />
      <FaqLd faqs={FAQS} />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="bg-signal/5 absolute top-0 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
            For everyone who is not the commissioner
          </p>
          <h1 className="font-display text-chalk mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
            You are not crazy for wanting to watch it happen.
          </h1>
          <p className="text-hashmark mt-5 text-lg leading-relaxed">
            In most leagues the draft order is decided by one person, alone, in
            a dashboard nobody else can see, and the rest of the league finds
            out afterwards. That is not evidence of anything. It is just a
            process with no way to check it, which is a strange thing to accept
            for the single decision that shapes everyone&apos;s season.
          </p>
          <p className="text-hashmark mt-4 text-lg leading-relaxed">
            The fix is not an accusation. It is a time, a link, and everyone
            looking at the same screen.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Point
            icon={Lock}
            title="Nothing to re-roll"
            body="The order is drawn server-side at a time set in advance. There is no button to press again if the result is disappointing."
          />
          <Point
            icon={Eye}
            title="Everyone watches at once"
            body="One link, one reveal, the same second for every viewer. Nobody gets told about it later."
          />
          <Point
            icon={ShieldQuestion}
            title="Checkable afterwards"
            body="Each draw records its seed and the exact commit of the shuffle that produced it. The code is public."
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <CommissionerAsk />
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <h2 className="font-display text-chalk text-2xl font-bold tracking-tight sm:text-3xl">
          The awkward questions
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
            Or skip the conversation entirely.
          </h3>
          <p className="text-hashmark mt-2 text-sm leading-relaxed">
            Schedule the draw yourself, share the link with the league, and let
            the result speak. It costs nothing and takes about a minute.
          </p>
          <Link
            href="/new?src=SKEPTIC"
            className="bg-signal text-midnight hover:bg-signal-dark shadow-signal/20 mt-5 inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold shadow-lg transition-colors"
          >
            Schedule the draw
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
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
