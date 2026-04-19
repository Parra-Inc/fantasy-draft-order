"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
  const [mode, setMode] = useState<Mode>("manual");
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
    <form onSubmit={handleSubmit} className="space-y-6">
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
        <Field label="Email (optional)">
          <input
            type="email"
            value={creatorEmail}
            onChange={(e) => setCreatorEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </Field>
      </div>

      <Field label="Scheduled for (local time)">
        <input
          type="datetime-local"
          required
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="input"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Must be at least 30 seconds in the future. Cannot be changed after creation.
        </p>
      </Field>

      <div className="space-y-3">
        <div className="flex gap-2 rounded-lg border p-1">
          <TabButton active={mode === "manual"} onClick={() => setMode("manual")}>
            Manual entry
          </TabButton>
          <TabButton active={mode === "import"} onClick={() => setMode("import")}>
            Import league
          </TabButton>
        </div>

        {mode === "manual" && (
          <Field label="Team names (one per line)">
            <textarea
              value={teamsText}
              onChange={(e) => setTeamsText(e.target.value)}
              rows={10}
              placeholder={"Team Alpha\nTeam Bravo\nTeam Charlie"}
              className="input font-mono"
            />
          </Field>
        )}

        {mode === "import" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr_auto]">
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
                  className="btn h-10"
                >
                  {importing ? "Loading…" : "Preview"}
                </button>
              </div>
            </div>
            {importedTeams && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="mb-2 text-sm font-medium">{importedTeams.length} teams found:</p>
                <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                  {importedTeams.map((t, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{i + 1}.</span>
                      <span className="font-medium">{t.name}</span>
                      {t.ownerName && (
                        <span className="text-muted-foreground">— {t.ownerName}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? "Creating…" : "Create draft"}
        </button>
      </div>

      <style>{`
        .input {
          display: block;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus { outline: 2px solid var(--ring); outline-offset: -1px; }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          padding: 0 1rem;
          height: 2.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary { background: var(--primary); color: var(--primary-foreground); border-color: var(--primary); }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
