"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const DEFAULT_FAQS = [
  {
    q: "Is it really free?",
    a: "Yes. Free to use, open source, no accounts. If you want to support it, star the GitHub repo.",
  },
  {
    q: "How do I know it's actually random?",
    a: "A Fisher-Yates shuffle driven by Node's crypto.randomInt, a cryptographically secure random source. Each draft records its seed and the exact source commit, so anyone in your league can read the code that picked the order and check the method themselves.",
  },
  {
    q: "Is this a draft order generator, randomizer, picker, or lottery?",
    a: "Those are all names your league might use for the same job, and this does it: one sealed random draw for the teams you enter. Call it a fantasy football draft order generator, a randomizer, a picker, or a draft lottery, the mechanics underneath are identical.",
  },
  {
    q: "Is there a draft order wheel or spinner?",
    a: "Yes. Each pick lands on a live spinning reel that every viewer watches at the same second. The difference from a wheel-of-names spinner is that the order is drawn server-side from a recorded seed before any animation plays, so nobody can keep spinning until they like the result.",
  },
  {
    q: "Can I use this for a keeper or dynasty league?",
    a: "Yes. The draw returns a random order for the teams you enter, so it works for keeper, dynasty, and redraft leagues alike. If your league only randomizes part of the board, enter just those teams and use the result for those slots.",
  },
  {
    q: "What happens if someone opens the link late?",
    a: "They see exactly what everyone else saw. Picks are revealed on the server at fixed times, so a late arrival catches the draw already in progress or the finished order, never a different one.",
  },
  {
    q: "Can the commissioner tamper with it?",
    a: "No. Once a draft is scheduled, teams and time are frozen. No edit endpoints exist. The draw fires automatically at the scheduled time, server-side.",
  },
  {
    q: "What if not everyone is online at the scheduled time?",
    a: "The draft page works forever. The seed, timestamps, and order are permanent, so anyone can open the link later and see exactly what happened.",
  },
  {
    q: "Which fantasy platforms work?",
    a: "Sleeper, MyFantasyLeague, Fleaflicker, and ESPN (public leagues). More coming. You can always add teams manually.",
  },
  {
    q: "Do you store anything about me?",
    a: "Only what you enter on the draft form: league name, your name, team names, and the scheduled time. No accounts, no tracking.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-sideline/50 border-b">
      <button
        onClick={() => setOpen(!open)}
        className="group flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-display text-chalk text-base font-semibold sm:text-lg">
          {q}
        </span>
        <ChevronDown
          className={`text-hashmark size-5 shrink-0 transition-transform duration-200 ${
            open ? "text-signal rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-hashmark pb-5 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type FaqProps = {
  faqs?: { q: string; a: string }[];
  heading?: string;
  emitJsonLd?: boolean;
};

export function Faq({
  faqs = DEFAULT_FAQS,
  heading = "Questions leagues ask.",
  emitJsonLd = true,
}: FaqProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section
      id="faq"
      className="border-sideline/50 bg-sideline/10 scroll-mt-20 border-t"
    >
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="text-center">
          <p className="text-signal font-mono text-xs font-medium tracking-wider uppercase">
            FAQ
          </p>
          <h2 className="font-display text-chalk mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {heading}
          </h2>
        </div>
        <div className="mt-10">
          {faqs.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
      {emitJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ) : null}
    </section>
  );
}
