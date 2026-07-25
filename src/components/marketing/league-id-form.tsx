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
              className="border-sideline/60 bg-midnight/40 text-chalk hover:bg-sideline/60 flex h-12 w-full shrink-0 items-center justify-between gap-2 rounded-xl border px-4 text-base font-semibold transition-colors sm:h-11 sm:w-auto sm:justify-start sm:rounded-full sm:border-transparent sm:bg-transparent sm:text-sm"
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
                className="border-sideline bg-midnight/95 absolute top-full left-0 z-20 mt-2 w-full overflow-hidden rounded-xl border p-1 shadow-2xl backdrop-blur-md sm:w-56"
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
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-base transition-colors sm:py-2 sm:text-sm ${
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
            data-focus-ring="parent"
            className="border-sideline/60 bg-midnight/40 text-chalk placeholder:text-hashmark h-12 w-full min-w-0 shrink-0 rounded-xl border px-4 text-base focus:outline-none sm:h-11 sm:flex-1 sm:border-transparent sm:bg-transparent sm:text-sm"
          />

          <button
            type="submit"
            disabled={!leagueId.trim() || submitting}
            className="bg-signal text-midnight hover:bg-signal-dark inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:rounded-full"
          >
            {submitting ? "Loading…" : "Import league"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </form>

      <p className="text-hashmark/80 mt-3 flex flex-col items-start gap-x-4 gap-y-1 px-1 text-left text-xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span className="font-mono break-words">{platform.hint}</span>
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
