"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Copy, MessageSquare } from "lucide-react";
import { env } from "@/lib/env";

/**
 * Composes the message a non-commissioner sends to their league chat.
 *
 * The hard part of this loop is not the tool, it is that asking your
 * commissioner to stop running the randomizer privately reads as an
 * accusation. So the copy does the diplomatic work: both tones argue about
 * process rather than about the commissioner, because a message that starts a
 * fight does not get sent, and a message that does not get sent does not
 * distribute anything.
 */

type Tone = "light" | "straight";

const TONES: { key: Tone; label: string; hint: string }[] = [
  { key: "light", label: "Keep it light", hint: "Jokey, low stakes" },
  { key: "straight", label: "Say it straight", hint: "Direct, no hedging" },
];

function compose(tone: Tone, leagueName: string, url: string) {
  const league = leagueName.trim() || "the league";

  if (tone === "light") {
    return [
      `Proposal for ${league}: let's draw the draft order in public this year.`,
      "",
      url,
      "",
      "You pick a time, everyone gets the same link, and we all watch the order come out at once. It's free and takes a minute to set up.",
      "",
      "Not accusing anyone of anything. I just want to watch it happen live instead of reading about it afterwards.",
    ].join("\n");
  }

  return [
    `For ${league} this year, can we run the draft order through this instead?`,
    "",
    url,
    "",
    "It draws the order at a scheduled time, on a link everyone has in advance, so the whole league sees the same result at the same moment. The shuffle is open-source and every draw records its seed and the exact commit that produced it.",
    "",
    "The point isn't that anyone cheated. It's that right now there's no way to show that nobody did, and there's no reason to keep it that way.",
  ].join("\n");
}

export function CommissionerAsk() {
  const [tone, setTone] = useState<Tone>("light");
  const [leagueName, setLeagueName] = useState("");
  const [copied, setCopied] = useState(false);

  // Canonical origin, not window.location: this link is going into somebody's
  // league chat and will outlive the tab it was copied from.
  const message = compose(
    tone,
    leagueName,
    `${env.NEXT_PUBLIC_BASE_URL}/new?src=SKEPTIC`,
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked. The textarea below is selectable.
    }
  }

  return (
    <section className="border-sideline/50 bg-sideline/20 rounded-2xl border p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <MessageSquare className="text-signal size-4" />
        <h2 className="font-display text-signal text-sm font-bold tracking-wider uppercase">
          Send it to the group chat
        </h2>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="text-chalk mb-1.5 block text-sm font-medium">
            League name <span className="text-hashmark">(optional)</span>
          </span>
          <input
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            placeholder="The Thursday Night League"
            className="input"
          />
        </label>

        <div className="border-sideline/60 bg-midnight/40 grid grid-cols-2 gap-2 rounded-xl border p-1">
          {TONES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTone(t.key)}
              className={`flex flex-col items-center rounded-lg px-3 py-2 transition-all ${
                tone === t.key
                  ? "bg-signal text-midnight"
                  : "text-hashmark hover:bg-sideline/50 hover:text-chalk"
              }`}
            >
              <span className="text-sm font-semibold">{t.label}</span>
              <span
                className={`text-[11px] ${tone === t.key ? "text-midnight/70" : "text-hashmark/70"}`}
              >
                {t.hint}
              </span>
            </button>
          ))}
        </div>

        <textarea
          readOnly
          value={message}
          rows={11}
          onFocus={(e) => e.currentTarget.select()}
          className="input font-mono text-[13px] leading-relaxed"
          aria-label="Message to send to your league"
        />

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={copy}
            className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold transition-colors ${
              copied
                ? "bg-signal/20 text-signal ring-signal/40 ring-1"
                : "bg-signal text-midnight hover:bg-signal-dark"
            }`}
          >
            {copied ? (
              <>
                <Check className="size-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-4" />
                Copy message
              </>
            )}
          </button>
          <Link
            href="/new?src=SKEPTIC"
            className="border-sideline/60 bg-midnight/50 text-chalk hover:border-signal/40 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border px-5 text-sm font-semibold transition-colors"
          >
            Just set it up yourself
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <p className="text-hashmark/70 text-xs">
          You do not have to be the commissioner to schedule a draw. Anyone can
          create one, and the link is the same for everybody.
        </p>
      </div>
    </section>
  );
}
