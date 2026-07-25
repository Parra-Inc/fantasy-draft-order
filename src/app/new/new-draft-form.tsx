"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Loader2, Sparkles, Users } from "lucide-react";
import { LeagueIdHelp } from "@/components/league-id-help";
import type { EntrySource } from "@/lib/db-enums";

type Mode = "manual" | "import";
type ImportSource = "SLEEPER" | "MFL" | "FLEAFLICKER" | "ESPN";

type ImportedTeam = {
  name: string;
  ownerName?: string;
  avatarUrl?: string;
};

function defaultScheduledFor() {
  const d = new Date(Date.now() + 10 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewDraftForm({
  initialMode,
  initialSource,
  initialLeagueId,
  referrerSlug,
  entrySource,
  cloneSlug,
}: {
  initialMode?: Mode;
  initialSource?: ImportSource;
  initialLeagueId?: string;
  referrerSlug?: string;
  entrySource?: EntrySource;
  cloneSlug?: string;
}) {
  const router = useRouter();
  // Cloning always lands in manual mode: the team list arrives as text, and
  // re-importing would defeat the point of copying a frozen roster.
  const [mode, setMode] = useState<Mode>(
    cloneSlug ? "manual" : (initialMode ?? "import"),
  );
  const [leagueName, setLeagueName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorEmail, setCreatorEmail] = useState("");
  const [scheduledFor, setScheduledFor] = useState(defaultScheduledFor);
  const [teamsText, setTeamsText] = useState("");

  const [source, setSource] = useState<ImportSource>(
    initialSource ?? "SLEEPER",
  );
  const [leagueId, setLeagueId] = useState(initialLeagueId ?? "");
  const [importedTeams, setImportedTeams] = useState<ImportedTeam[] | null>(
    null,
  );
  const autoImports =
    Boolean(initialLeagueId) && initialMode !== "manual" && !cloneSlug;
  const [importing, setImporting] = useState(autoImports);
  const [submitting, setSubmitting] = useState(false);
  const [cloning, setCloning] = useState(Boolean(cloneSlug));
  const [clonedFrom, setClonedFrom] = useState<string | null>(null);

  const runImport = useCallback(
    async (nextSource: ImportSource, nextLeagueId: string) => {
      try {
        const res = await fetch(
          `/api/drafts/import/${nextSource.toLowerCase()}?leagueId=${encodeURIComponent(nextLeagueId)}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "import failed");
        setImportedTeams(data.teams);
        if (data.leagueName) {
          setLeagueName((current) => current.trim() || data.leagueName);
        }
        toast.success(`Found ${data.teams.length} teams`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "import failed");
      } finally {
        setImporting(false);
      }
    },
    [],
  );

  function handlePreview(nextSource: ImportSource, nextLeagueId: string) {
    setImporting(true);
    setImportedTeams(null);
    void runImport(nextSource, nextLeagueId);
  }

  // Landing on /new?source=…&leagueId=… imports straight away.
  const autoImported = useRef(false);
  useEffect(() => {
    if (autoImported.current || !autoImports || !initialLeagueId) return;
    autoImported.current = true;
    void runImport(initialSource ?? "SLEEPER", initialLeagueId);
  }, [runImport, autoImports, initialSource, initialLeagueId]);

  // Landing on /new?clone=<slug> copies that draft's frozen roster into the
  // manual textarea. The state endpoint already returns exactly what is needed
  // and is public, so this needs no new route and, crucially, no database read
  // in /new itself — that page is statically rendered and indexable, and
  // reading D1 there would force it dynamic.
  const cloned = useRef(false);
  useEffect(() => {
    if (cloned.current || !cloneSlug) return;
    cloned.current = true;
    (async () => {
      try {
        const res = await fetch(`/api/drafts/${cloneSlug}/state`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "could not load that draft");
        const names: string[] = (data.teams ?? []).map(
          (t: { name: string }) => t.name,
        );
        if (names.length === 0) throw new Error("that draft has no teams");
        setTeamsText(names.join("\n"));
        setLeagueName((current) => current.trim() || (data.leagueName ?? ""));
        setClonedFrom(data.leagueName ?? null);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "could not copy those teams",
        );
      } finally {
        setCloning(false);
      }
    })();
  }, [cloneSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let teams:
        | { name: string; ownerName?: string; avatarUrl?: string }[]
        | undefined;
      if (mode === "manual") {
        teams = teamsText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((name) => ({ name }));
        if (teams.length < 2) {
          toast.error("Enter at least 2 team names (one per line)");
          setSubmitting(false);
          return;
        }
      } else if (!importedTeams) {
        toast.error("Import teams first");
        setSubmitting(false);
        return;
      }

      const body = {
        leagueName,
        creatorName,
        creatorEmail: creatorEmail || undefined,
        scheduledFor: new Date(scheduledFor).toISOString(),
        ...(mode === "manual" ? { teams } : { import: { source, leagueId } }),
        referrerSlug,
        entrySource,
      };

      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Please check the fields and try again.",
        );
      }
      router.push(`/d/${data.slug}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card title="League details">
        <Field label="League name">
          <input
            required
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            placeholder="The Thursday Night League"
            className="input"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <input
              required
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="Commissioner"
              className="input"
            />
          </Field>
          <Field label="Email" hint="optional">
            <input
              type="email"
              value={creatorEmail}
              onChange={(e) => setCreatorEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
          </Field>
        </div>

        <Field label="Scheduled for" hint="local time · locked once created">
          <input
            type="datetime-local"
            required
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="input"
          />
        </Field>
      </Card>

      <Card title="Teams">
        <div className="border-sideline/60 bg-midnight/40 grid grid-cols-2 gap-2 rounded-xl border p-1">
          <TabButton
            active={mode === "import"}
            icon={Sparkles}
            onClick={() => setMode("import")}
          >
            Import league
          </TabButton>
          <TabButton
            active={mode === "manual"}
            icon={Users}
            onClick={() => setMode("manual")}
          >
            Manual entry
          </TabButton>
        </div>

        {mode === "manual" && (
          <div className="space-y-4">
            {cloning && (
              <div className="border-sideline/60 bg-midnight/40 text-hashmark flex items-center gap-2 rounded-xl border p-4 text-sm">
                <Loader2 className="text-signal size-4 animate-spin" />
                Copying teams from the previous draw…
              </div>
            )}
            {clonedFrom && (
              <div className="border-signal/30 bg-signal/5 flex items-start gap-2.5 rounded-xl border p-4">
                <Copy className="text-signal mt-0.5 size-4 shrink-0" />
                <p className="text-hashmark text-sm">
                  Teams copied from{" "}
                  <span className="text-chalk font-semibold">{clonedFrom}</span>
                  . Edit them however you like: this is a brand new draw with a
                  new seed, and it does not touch the original.
                </p>
              </div>
            )}
            <Field label="Team names" hint="one per line · min 2">
              <textarea
                value={teamsText}
                onChange={(e) => setTeamsText(e.target.value)}
                rows={10}
                placeholder={"Gridiron Goons\nBlitz Brigade\nRed Zone Royals"}
                className="input font-mono"
              />
            </Field>
          </div>
        )}

        {mode === "import" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr_auto]">
              <Field label="Platform">
                <select
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value as ImportSource);
                    setImportedTeams(null);
                  }}
                  className="input"
                >
                  <option value="SLEEPER">Sleeper</option>
                  <option value="MFL">MyFantasyLeague</option>
                  <option value="FLEAFLICKER">Fleaflicker</option>
                  <option value="ESPN">ESPN (public)</option>
                </select>
              </Field>
              <Field label="League ID">
                <input
                  value={leagueId}
                  onChange={(e) => {
                    setLeagueId(e.target.value);
                    setImportedTeams(null);
                  }}
                  placeholder="123456789"
                  className="input"
                />
              </Field>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => handlePreview(source, leagueId.trim())}
                  disabled={importing || !leagueId.trim()}
                  className="btn btn-outline h-10 w-full sm:w-auto"
                >
                  {importing ? "Loading…" : "Preview"}
                </button>
              </div>
            </div>

            <LeagueIdHelp source={source} />

            {importing && (
              <div className="border-sideline/60 bg-midnight/40 text-hashmark flex items-center gap-2 rounded-xl border p-4 text-sm">
                <Loader2 className="text-signal size-4 animate-spin" />
                Importing your league…
              </div>
            )}

            {importedTeams && (
              <div className="border-signal/30 bg-signal/5 rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="bg-signal/20 flex size-6 items-center justify-center rounded-full">
                    <Check className="text-signal size-3.5" />
                  </div>
                  <p className="text-chalk text-sm font-semibold">
                    {importedTeams.length} teams found
                  </p>
                </div>
                <ul className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
                  {importedTeams.map((t, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-hashmark w-5 text-right font-mono text-xs">
                        {i + 1}
                      </span>
                      <span className="text-chalk truncate font-medium">
                        {t.name}
                      </span>
                      {t.ownerName && (
                        <span className="text-hashmark truncate text-xs">
                          — {t.ownerName}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary shadow-signal/20 h-12 w-full px-8 text-base shadow-lg sm:w-auto"
        >
          {submitting ? "Creating…" : "Create draft →"}
        </button>
      </div>
    </form>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-sideline/50 bg-sideline/20 rounded-2xl border p-6 sm:p-7">
      <h2 className="font-display text-signal mb-5 text-sm font-bold tracking-wider uppercase">
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-chalk text-sm font-medium">{label}</span>
        {hint && <span className="text-hashmark text-xs">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function TabButton({
  active,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
        active
          ? "bg-signal text-midnight"
          : "text-hashmark hover:bg-sideline/50 hover:text-chalk"
      }`}
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}
