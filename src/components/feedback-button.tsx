"use client";

import { AnimatePresence, motion } from "motion/react";
import { MessageSquare, X } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Select } from "@/components/ui/field";

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
        className="bg-signal text-midnight shadow-signal/20 hover:bg-signal-dark fixed right-4 bottom-4 z-40 inline-flex h-12 items-center gap-2 rounded-full pr-5 pl-4 text-sm font-semibold shadow-lg transition-colors sm:right-6 sm:bottom-6"
      >
        <MessageSquare className="size-4" />
        Feedback
      </button>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Stable no-op: this store never changes after the first client render. */
const subscribeToNothing = () => () => {};

/**
 * False on the server and during hydration, true afterwards.
 *
 * createPortal needs document.body, which does not exist while rendering on
 * the server, and a bare `typeof document !== "undefined"` would emit
 * different markup on each side and fail hydration. useSyncExternalStore is
 * the sanctioned way to express that difference: React takes the server
 * snapshot for the server pass and the client snapshot after, with no
 * setState in an effect and no cascading render on mount.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const mounted = useHydrated();
  const [type, setType] = useState<FeedbackType>("BUG");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();
  const titleId = useId();
  const messageId = useId();
  const typeId = useId();
  const emailId = useId();
  const emailErrorId = useId();
  const errorId = useId();
  const disclosureId = useId();

  const trimmedEmail = email.trim();
  const emailInvalid =
    trimmedEmail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => messageRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Keep Tab inside the dialog while it is open.
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
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
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (message.trim().length < 5) {
      setError("Add a few more details so we can help.");
      return;
    }
    if (emailInvalid) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          email: trimmedEmail || undefined,
          page: pathname ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      toast.success("Thanks, we got it.");
      reset();
      onClose();
    } catch {
      setError("Couldn't send feedback. Check your connection and try again.");
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
            ref={dialogRef}
            className="border-sideline/60 bg-midnight relative w-full max-w-lg rounded-t-2xl border shadow-2xl sm:rounded-2xl"
          >
            <header className="border-sideline/40 flex items-start justify-between gap-3 border-b p-5">
              <div>
                <p className="text-signal font-mono text-[11px] font-medium tracking-wider uppercase">
                  Leave feedback
                </p>
                <h2
                  id={titleId}
                  className="font-display text-chalk mt-1 text-xl font-bold"
                >
                  Found a bug or got an idea?
                </h2>
                <p className="text-hashmark mt-1 text-xs">
                  Tell us what&apos;s up. No account needed.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close feedback"
                className="text-hashmark hover:bg-sideline/40 hover:text-chalk rounded-lg p-1.5 transition-colors"
              >
                <X className="size-5" />
              </button>
            </header>

            <form
              onSubmit={submit}
              noValidate
              aria-describedby={disclosureId}
              className="space-y-4 p-5"
            >
              <div>
                <label
                  htmlFor={typeId}
                  className="text-hashmark mb-1.5 block font-mono text-[11px] font-medium tracking-wider uppercase"
                >
                  Type
                </label>
                <Select
                  id={typeId}
                  value={type}
                  onChange={(e) => setType(e.target.value as FeedbackType)}
                  disabled={submitting}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  htmlFor={messageId}
                  className="text-hashmark mb-1.5 block font-mono text-[11px] font-medium tracking-wider uppercase"
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
                <p className="text-hashmark/70 mt-1 text-right text-[11px]">
                  {message.length}/5000
                </p>
              </div>

              <div>
                <label
                  htmlFor={emailId}
                  className="text-hashmark mb-1.5 block font-mono text-[11px] font-medium tracking-wider uppercase"
                >
                  Email{" "}
                  <span className="text-hashmark/60 normal-case">
                    (optional, if you want a reply)
                  </span>
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
                  aria-invalid={emailInvalid || undefined}
                  aria-describedby={emailInvalid ? emailErrorId : undefined}
                />
                {emailInvalid && (
                  <p id={emailErrorId} className="text-blitz mt-1 text-xs">
                    Enter a valid email, or leave it blank.
                  </p>
                )}
              </div>

              {error && (
                <p
                  id={errorId}
                  role="alert"
                  className="border-blitz/40 bg-blitz/10 text-blitz rounded-lg border px-3 py-2 text-sm"
                >
                  {error}
                </p>
              )}

              <p id={disclosureId} className="text-hashmark/70 text-[11px]">
                We send your feedback type, message, email (if you add one), the
                page you&apos;re on, and your browser&apos;s user agent. Feedback
                is processed by RevenueHog.
              </p>

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
                  disabled={submitting || message.trim().length < 5 || emailInvalid}
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
