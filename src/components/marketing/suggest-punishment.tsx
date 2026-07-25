"use client";

import { AnimatePresence, motion } from "motion/react";
import { Lightbulb, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  PUNISHMENT_CATEGORIES,
  PUNISHMENT_CATEGORY_LABELS,
  type PunishmentCategory,
} from "@/lib/db-enums";

/**
 * Submit a punishment idea for review.
 *
 * Structurally the same modal as components/feedback-button.tsx — same portal,
 * same hydration guard, same select-plus-input shape — because there is no
 * reason for this site to have two different modal idioms.
 *
 * The copy is careful never to imply the idea is live. Everything lands as
 * PENDING and is approved by hand, so telling someone "added!" would send them
 * looking for something that is not on the page.
 */
export function SuggestPunishmentButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-sideline text-chalk hover:border-signal/50 inline-flex h-11 items-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-colors"
      >
        <Lightbulb className="size-4" />
        Suggest a punishment
      </button>
      <SuggestModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Stable no-op: this store never changes after the first client render. */
const subscribeToNothing = () => () => {};

/**
 * False on the server and during hydration, true afterwards. createPortal needs
 * document.body, and a bare `typeof document !== "undefined"` would emit
 * different markup on each side and fail hydration.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

function SuggestModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const mounted = useHydrated();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<PunishmentCategory>("PUBLIC");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const labelRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();
  const labelId = useId();
  const categoryId = useId();
  const emailId = useId();

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => labelRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const trimmed = label.trim();
    if (trimmed.length < 3) {
      toast.error("Give the punishment a few more words.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/punishment-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: trimmed,
          category,
          email: email.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      toast.success("Sent for review. Good ones get added.");
      setLabel("");
      setEmail("");
      onClose();
    } catch {
      toast.error("Couldn't send that. Try again in a sec.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="bg-midnight/70 absolute inset-0 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="border-sideline/60 bg-midnight relative w-full max-w-lg rounded-t-2xl border shadow-2xl sm:rounded-2xl"
          >
            <header className="border-sideline/40 flex items-start justify-between gap-3 border-b p-5">
              <div>
                <p className="text-signal font-mono text-[11px] font-medium tracking-wider uppercase">
                  Suggest a punishment
                </p>
                <h2
                  id={titleId}
                  className="font-display text-chalk mt-1 text-xl font-bold"
                >
                  What should last place have to do?
                </h2>
                <p className="text-hashmark mt-1 text-xs">
                  Reviewed by a human before it appears. Nothing goes live
                  automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-hashmark hover:bg-sideline/40 hover:text-chalk rounded-lg p-1.5 transition-colors"
              >
                <X className="size-5" />
              </button>
            </header>

            <form onSubmit={submit} className="space-y-4 p-5">
              <div>
                <label
                  htmlFor={labelId}
                  className="text-hashmark mb-1.5 block font-mono text-[11px] font-medium tracking-wider uppercase"
                >
                  The punishment
                </label>
                <textarea
                  id={labelId}
                  ref={labelRef}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                  minLength={3}
                  maxLength={120}
                  rows={3}
                  placeholder="Wear a full mascot costume to the next draft…"
                  className="input resize-y"
                  disabled={submitting}
                />
                <p className="text-hashmark/70 mt-1 text-right text-[11px]">
                  {label.length}/120
                </p>
              </div>

              <div>
                <label
                  htmlFor={categoryId}
                  className="text-hashmark mb-1.5 block font-mono text-[11px] font-medium tracking-wider uppercase"
                >
                  Category
                </label>
                <select
                  id={categoryId}
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as PunishmentCategory)
                  }
                  className="input"
                  disabled={submitting}
                >
                  {PUNISHMENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {PUNISHMENT_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={emailId}
                  className="text-hashmark mb-1.5 block font-mono text-[11px] font-medium tracking-wider uppercase"
                >
                  Email (optional)
                </label>
                <input
                  id={emailId}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  disabled={submitting}
                />
                <p className="text-hashmark/70 mt-1 text-[11px]">
                  Only so you can be told if it gets added. Never shown on the
                  site.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-signal text-midnight hover:bg-signal-dark inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send for review"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
