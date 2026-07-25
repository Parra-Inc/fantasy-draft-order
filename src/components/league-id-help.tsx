"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, HelpCircle } from "lucide-react";
import type { ImportSource } from "@/lib/importers/types";
import { getLeagueIdGuideBySource } from "@/lib/seo/league-id-guides";

/**
 * Inline "where do I find this?" help for the league ID field. Same content as
 * the /league-id/<platform> pages, trimmed to fit under the input. Opens the
 * full page in a new tab so an in-progress form is never lost.
 */
export function LeagueIdHelp({ source }: { source: ImportSource }) {
  const [open, setOpen] = useState(false);
  const guide = getLeagueIdGuideBySource(source);
  if (!guide) return null;

  const [before, after = ""] = guide.exampleUrl.split(guide.exampleId);

  return (
    <div className="border-sideline/60 bg-midnight/40 rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-chalk flex items-center gap-2 text-sm">
          <HelpCircle className="text-signal size-4 shrink-0" />
          Where do I find my {guide.short} league ID?
        </span>
        <ChevronDown
          className={`text-hashmark size-4 shrink-0 transition-transform ${
            open ? "text-signal rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-sideline/60 border-t px-4 py-4">
          <p className="text-hashmark overflow-x-auto font-mono text-xs">
            {before}
            <span className="bg-signal/20 text-signal rounded px-1 py-0.5 font-bold">
              {guide.exampleId}
            </span>
            {after}
          </p>
          <p className="text-hashmark mt-2 text-xs">{guide.idShape}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-chalk text-xs font-semibold tracking-wider uppercase">
                On the web
              </p>
              <ol className="mt-2 space-y-1.5">
                {guide.webSteps.map((step, i) => (
                  <li
                    key={step}
                    className="text-chalk/80 flex gap-2 text-xs leading-relaxed"
                  >
                    <span className="text-signal font-mono">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-chalk text-xs font-semibold tracking-wider uppercase">
                {guide.appLabel}
              </p>
              <ol className="mt-2 space-y-1.5">
                {guide.appSteps.map((step, i) => (
                  <li
                    key={step}
                    className="text-chalk/80 flex gap-2 text-xs leading-relaxed"
                  >
                    <span className="text-signal font-mono">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <p className="bg-sideline/40 text-chalk/80 mt-4 rounded-lg px-3 py-2 text-xs leading-relaxed">
            {guide.gotchas[0]}
          </p>

          <a
            href={`/league-id/${guide.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-signal hover:text-signal-dark mt-4 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
          >
            Full {guide.platform} walkthrough
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}
    </div>
  );
}
