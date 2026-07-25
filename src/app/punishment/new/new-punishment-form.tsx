"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { EntrySource } from "@/lib/db-enums";

/** Matches the max on POST /api/punishments. */
const MAX_OPTIONS = 24;

function defaultScheduledFor() {
  const d = new Date(Date.now() + 10 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewPunishmentForm({
  initialOptions,
  entrySource,
}: {
  /** Labels resolved from `?ideas=` on the server. May be empty. */
  initialOptions: string[];
  entrySource?: EntrySource;
}) {
  const router = useRouter();
  const [leagueName, setLeagueName] = useState("");
  const [loserName, setLoserName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorEmail, setCreatorEmail] = useState("");
  const [scheduledFor, setScheduledFor] = useState(defaultScheduledFor);
  const [submitting, setSubmitting] = useState(false);

  // Always keep at least two rows visible so the shape of the thing is obvious
  // to someone arriving with no ideas preselected.
  const [options, setOptions] = useState<string[]>(() => {
    const seeded = initialOptions.slice(0, MAX_OPTIONS);
    while (seeded.length < 2) seeded.push("");
    return seeded;
  });

  function setOption(index: number, value: string) {
    setOptions((current) =>
      current.map((option, i) => (i === index ? value : option)),
    );
  }

  function addOption() {
    setOptions((current) =>
      current.length >= MAX_OPTIONS ? current : [...current, ""],
    );
  }

  function removeOption(index: number) {
    setOptions((current) =>
      current.length <= 2
        ? current.map((option, i) => (i === index ? "" : option))
        : current.filter((_, i) => i !== index),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      // De-duplicate case-insensitively here too, so the count the user is
      // told about matches the one the server will enforce.
      const seen = new Set<string>();
      const cleaned: string[] = [];
      for (const option of options) {
        const label = option.trim();
        if (!label) continue;
        const key = label.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        cleaned.push(label);
      }
      if (cleaned.length < 2) {
        toast.error("Add at least 2 different punishments");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/punishments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          leagueName,
          loserName,
          creatorName,
          creatorEmail: creatorEmail || undefined,
          scheduledFor: new Date(scheduledFor).toISOString(),
          options: cleaned,
          entrySource,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Please check the fields and try again.",
        );
      }
      router.push(`/p/${data.slug}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  const filledCount = new Set(
    options.map((o) => o.trim().toLowerCase()).filter(Boolean),
  ).size;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card title="Who lost">
        <Field label="League name">
          <input
            required
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            placeholder="The Thursday Night League"
            className="input"
          />
        </Field>

        <Field label="Last place" hint="the name everyone will see">
          <input
            required
            value={loserName}
            onChange={(e) => setLoserName(e.target.value)}
            placeholder="Dave"
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

        <Field label="Spins at" hint="local time · locked once created">
          <input
            type="datetime-local"
            required
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="input"
          />
        </Field>
        <p className="text-hashmark text-xs">
          Share the link before this time. A sealed result only proves anything
          to people who had it beforehand.
        </p>
      </Card>

      <Card title={`On the wheel · ${filledCount}`}>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-hashmark w-6 shrink-0 text-right font-mono text-xs tabular-nums">
                {index + 1}
              </span>
              <input
                value={option}
                onChange={(e) => setOption(index, e.target.value)}
                maxLength={120}
                placeholder={
                  index === 0
                    ? "Waffle House marathon"
                    : index === 1
                      ? "Wear a mascot costume to the next draft"
                      : "Another punishment…"
                }
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                aria-label={`Remove punishment ${index + 1}`}
                className="text-hashmark hover:bg-sideline/40 hover:text-chalk shrink-0 rounded-lg p-2 transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>

        {options.length < MAX_OPTIONS && (
          <button
            type="button"
            onClick={addOption}
            className="border-sideline text-hashmark hover:border-signal/50 hover:text-chalk inline-flex h-10 items-center gap-2 rounded-xl border border-dashed px-4 text-sm font-medium transition-colors"
          >
            <Plus className="size-4" />
            Add a punishment
          </button>
        )}

        <p className="text-hashmark text-xs">
          Everyone can see this list before the draw. That is the point: it
          proves nothing was added or removed once the answer was known.
        </p>
      </Card>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="bg-signal text-midnight hover:bg-signal-dark inline-flex h-12 items-center rounded-xl px-6 text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {submitting ? "Sealing…" : "Seal the wheel →"}
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
