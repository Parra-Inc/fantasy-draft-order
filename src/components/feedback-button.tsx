"use client";

import { AnimatePresence, motion } from "motion/react";
import { MessageSquare, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

type FeedbackType = "BUG" | "FEATURE" | "PRAISE" | "OTHER";

const TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: "BUG", label: "Bug" },
  { value: "FEATURE", label: "Feature request" },
  { value: "PRAISE", label: "Praise" },
  { value: "OTHER", label: "Other" },
];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Leave feedback"
        className="fixed right-4 bottom-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-signal pr-5 pl-4 text-sm font-semibold text-midnight shadow-lg shadow-signal/20 transition-colors hover:bg-signal-dark sm:right-6 sm:bottom-6"
      >
        <MessageSquare className="size-4" />
        Feedback
      </button>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [type, setType] = useState<FeedbackType>("BUG");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();
  const titleId = useId();
  const messageId = useId();
  const typeId = useId();
  const emailId = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => messageRef.current?.focus(), 50);
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

  const reset = () => {
    setType("BUG");
    setMessage("");
    setEmail("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (message.trim().length < 5) {
      toast.error("Add a few more details so we can help.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          email: email.trim() || undefined,
          page: pathname ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      toast.success("Thanks — we got it.");
      reset();
      onClose();
    } catch {
      toast.error("Couldn't send feedback. Try again in a sec.");
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
            className="absolute inset-0 bg-midnight/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-lg rounded-t-2xl border border-sideline/60 bg-midnight shadow-2xl sm:rounded-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-sideline/40 p-5">
              <div>
                <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-signal">
                  Leave feedback
                </p>
                <h2
                  id={titleId}
                  className="mt-1 font-display text-xl font-bold text-chalk"
                >
                  Found a bug or got an idea?
                </h2>
                <p className="mt-1 text-xs text-hashmark">
                  Tell us what&apos;s up. No account needed.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close feedback"
                className="rounded-lg p-1.5 text-hashmark transition-colors hover:bg-sideline/40 hover:text-chalk"
              >
                <X className="size-5" />
              </button>
            </header>

            <form onSubmit={submit} className="space-y-4 p-5">
              <div>
                <label
                  htmlFor={typeId}
                  className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-wider text-hashmark"
                >
                  Type
                </label>
                <select
                  id={typeId}
                  value={type}
                  onChange={(e) => setType(e.target.value as FeedbackType)}
                  className="input"
                  disabled={submitting}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={messageId}
                  className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-wider text-hashmark"
                >
                  Feedback
                </label>
                <textarea
                  id={messageId}
                  ref={messageRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={5}
                  maxLength={5000}
                  rows={5}
                  placeholder="What happened, what you expected, or what you'd like to see…"
                  className="input resize-y"
                  disabled={submitting}
                />
                <p className="mt-1 text-right text-[11px] text-hashmark/70">
                  {message.length}/5000
                </p>
              </div>

              <div>
                <label
                  htmlFor={emailId}
                  className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-wider text-hashmark"
                >
                  Email <span className="normal-case text-hashmark/60">(optional, if you want a reply)</span>
                </label>
                <input
                  id={emailId}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  disabled={submitting}
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || message.trim().length < 5}
                >
                  {submitting ? "Sending…" : "Send feedback"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
