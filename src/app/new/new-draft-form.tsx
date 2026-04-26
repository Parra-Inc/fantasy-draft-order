"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Sparkles, Users } from "lucide-react";

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

export function NewDraftForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("import");
  const [leagueName, setLeagueName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorEmail, setCreatorEmail] = useState("");
  const [scheduledFor, setScheduledFor] = useState(defaultScheduledFor);
  const [teamsText, setTeamsText] = useState("");

  const [source, setSource] = useState<ImportSource>("SLEEPER");
  const [leagueId, setLeagueId] = useState("");
  const [importedTeams, setImportedTeams] = useState<ImportedTeam[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handlePreview() {
    setImporting(true);
    setImportedTeams(null);
    try {
      const res = await fetch(
        `/api/drafts/import/${source.toLowerCase()}?leagueId=${encodeURIComponent(leagueId)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "import failed");
      setImportedTeams(data.teams);
      if (data.leagueName && !leagueName.trim()) {
        setLeagueName(data.leagueName);
      }
      toast.success(`Found ${data.teams.length} teams`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "import failed");
    } finally {
      setImporting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let teams: { name: string; ownerName?: string; avatarUrl?: string }[] | undefined;
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
      };

      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Please check the fields and try again.",
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

        <Field
          label="Scheduled for"
          hint="local time · locked once created"
        >
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
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-sideline/60 bg-midnight/40 p-1">
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
          <Field
            label="Team names"
            hint="one per line · min 2"
          >
            <textarea
              value={teamsText}
              onChange={(e) => setTeamsText(e.target.value)}
              rows={10}
              placeholder={"Gridiron Goons\nBlitz Brigade\nRed Zone Royals"}
              className="input font-mono"
            />
          </Field>
        )}

        {mode === "import" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr_auto]">
              <Field label="Platform">
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as ImportSource)}
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
                  onChange={(e) => setLeagueId(e.target.value)}
                  placeholder="123456789"
                  className="input"
                />
              </Field>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={importing || !leagueId}
                  className="btn btn-outline h-10 w-full sm:w-auto"
                >
                  {importing ? "Loading…" : "Preview"}
                </button>
              </div>
            </div>

            {importedTeams && (
              <div className="rounded-xl border border-signal/30 bg-signal/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-full bg-signal/20">
                    <Check className="size-3.5 text-signal" />
                  </div>
                  <p className="text-sm font-semibold text-chalk">
                    {importedTeams.length} teams found
                  </p>
                </div>
                <ul className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
                  {importedTeams.map((t, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-5 text-right font-mono text-xs text-hashmark">
                        {i + 1}
                      </span>
                      <span className="truncate font-medium text-chalk">
                        {t.name}
                      </span>
                      {t.ownerName && (
                        <span className="truncate text-xs text-hashmark">
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
          className="btn btn-primary h-12 w-full px-8 text-base shadow-lg shadow-signal/20 sm:w-auto"
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
    <section className="rounded-2xl border border-sideline/50 bg-sideline/20 p-6 sm:p-7">
      <h2 className="mb-5 font-display text-sm font-bold uppercase tracking-wider text-signal">
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
        <span className="text-sm font-medium text-chalk">{label}</span>
        {hint && <span className="text-xs text-hashmark">{hint}</span>}
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
