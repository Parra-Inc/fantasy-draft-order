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
    q: "What randomness does it use?",
    a: "A Fisher–Yates shuffle driven by Node's crypto.randomInt — a cryptographically-secure PRNG. Each draft records its seed and the exact source commit so you can reproduce or audit the method.",
  },
  {
    q: "Can the commissioner tamper with it?",
    a: "No. Once a draft is scheduled, teams and time are frozen. No edit endpoints exist. The draw fires automatically at the scheduled time, server-side.",
  },
  {
    q: "What if not everyone is online at the scheduled time?",
    a: "The draft page works forever. The seed, timestamps, and order are permanent — anyone can open the link later and see exactly what happened.",
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
    <div className="border-b border-sideline/50">
      <button
        onClick={() => setOpen(!open)}
        className="group flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-display text-base font-semibold text-chalk sm:text-lg">
          {q}
        </span>
        <ChevronDown
          className={`size-5 shrink-0 text-hashmark transition-transform duration-200 ${
            open ? "rotate-180 text-signal" : ""
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
            <p className="pb-5 text-sm leading-relaxed text-hashmark">{a}</p>
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
      className="scroll-mt-20 border-t border-sideline/50 bg-sideline/10"
    >
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-wider text-signal">
            FAQ
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-chalk sm:text-4xl">
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
