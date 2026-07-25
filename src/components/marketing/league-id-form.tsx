"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import type { ImportSource } from "@/lib/importers/types";

export const PLATFORMS: {
  source: ImportSource;
  label: string;
  short: string;
  placeholder: string;
  hint: string;
  helpPath: string;
}[] = [
  {
    source: "SLEEPER",
    label: "Sleeper",
    short: "Sleeper",
    placeholder: "123456789012345678",
    hint: "sleeper.com/leagues/<league ID>",
    helpPath: "/league-id/sleeper",
  },
  {
    source: "ESPN",
    label: "ESPN",
    short: "ESPN",
    placeholder: "1234567",
    hint: "espn.com/football/league?leagueId=<league ID> · public leagues only",
    helpPath: "/league-id/espn",
  },
  {
    source: "MFL",
    label: "MyFantasyLeague",
    short: "MFL",
    placeholder: "12345",
    hint: "myfantasyleague.com/…/home/<league ID>",
    helpPath: "/league-id/mfl",
  },
  {
    source: "FLEAFLICKER",
    label: "Fleaflicker",
    short: "Fleaflicker",
    placeholder: "312345",
    hint: "fleaflicker.com/nfl/leagues/<league ID>",
    helpPath: "/league-id/fleaflicker",
  },
];

export function LeagueIdForm({
  defaultSource = "SLEEPER",
  showHelpLink = true,
}: {
  defaultSource?: ImportSource;
  showHelpLink?: boolean;
}) {
  const router = useRouter();
  const [source, setSource] = useState<ImportSource>(defaultSource);
  const [leagueId, setLeagueId] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const platform = PLATFORMS.find((p) => p.source === source) ?? PLATFORMS[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = leagueId.trim();
    if (!id) return;
    setSubmitting(true);
    router.push(
      `/new?source=${source.toLowerCase()}&leagueId=${encodeURIComponent(id)}`,
    );
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-xl">
      <form onSubmit={handleSubmit}>
        <div className="group border-sideline bg-sideline/30 shadow-signal/5 focus-within:border-signal/60 focus-within:shadow-signal/10 flex flex-col gap-2 rounded-2xl border p-2 shadow-xl backdrop-blur-sm transition-colors sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-1.5">
          {/* Platform picker */}
          <div ref={menuRef} className="relative sm:shrink-0">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label={`Platform: ${platform.label}`}
              className="text-chalk hover:bg-sideline/60 flex h-11 w-full items-center justify-between gap-2 rounded-xl px-4 text-sm font-semibold transition-colors sm:w-auto sm:justify-start sm:rounded-full"
            >
              <span className="flex items-center gap-2">
                <span className="bg-signal size-1.5 rounded-full" />
                {platform.short}
              </span>
              <ChevronDown
                className={`text-hashmark size-4 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <div
                role="listbox"
                className="border-sideline bg-midnight/95 absolute top-full left-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border p-1 shadow-2xl backdrop-blur-md"
              >
                {PLATFORMS.map((p) => (
                  <button
                    key={p.source}
                    type="button"
                    role="option"
                    aria-selected={p.source === source}
                    onClick={() => {
                      setSource(p.source);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      p.source === source
                        ? "bg-signal/10 text-signal"
                        : "text-chalk hover:bg-sideline/60"
                    }`}
                  >
                    {p.label}
                    {p.source === source && <Check className="size-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-sideline hidden h-6 w-px shrink-0 sm:block" />

          <input
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            aria-label={`${platform.label} league ID`}
            placeholder={`League ID · ${platform.placeholder}`}
            className="border-sideline/60 bg-midnight/40 text-chalk placeholder:text-hashmark h-11 min-w-0 flex-1 rounded-xl border px-4 text-sm focus:outline-none sm:border-transparent sm:bg-transparent"
          />

          <button
            type="submit"
            disabled={!leagueId.trim() || submitting}
            className="bg-signal text-midnight hover:bg-signal-dark inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-6 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-full"
          >
            {submitting ? "Loading…" : "Import league"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </form>

      <p className="text-hashmark/80 mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-left text-xs">
        <span className="font-mono">{platform.hint}</span>
        {showHelpLink && (
          <Link
            href={platform.helpPath}
            className="text-signal font-medium underline-offset-4 transition-colors hover:underline"
          >
            Where do I find this?
          </Link>
        )}
      </p>
    </div>
  );
}
