"use client";

import { useId, useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import type { NewsletterSource } from "@/lib/newsletter";
import { cn } from "@/lib/utils";
import { markNewsletterSubscribed, useNewsletterSubscribed } from "./use-newsletter-subscribed";

/**
 * One grouped control: the field's right corners and the button's left
 * corners are squared so the two read as a single pill. `sm` is the footer
 * size, `md` the landing page section.
 */
export function NewsletterForm({
  source,
  size = "md",
  className,
}: {
  source: NewsletterSource;
  size?: "sm" | "md";
  className?: string;
}) {
  const subscribed = useNewsletterSubscribed();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  if (subscribed) {
    return (
      <p role="status" className={cn("text-signal flex items-center gap-2 text-sm font-medium", className)}>
        <Check className="size-4" aria-hidden />
        You&apos;re subscribed. See you before draft day.
      </p>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const website = String(new FormData(e.currentTarget).get("website") ?? "");
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source, website }),
      });
      if (res.ok) {
        markNewsletterSubscribed();
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Something went wrong. Try again.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  const height = size === "sm" ? "h-9 text-sm" : "h-11";
  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex w-full" aria-busy={pending || undefined}>
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <Input
          id={inputId}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
          className={cn(height, "min-w-0 flex-1 rounded-r-none focus-visible:z-10")}
        />
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <button
          type="submit"
          disabled={pending}
          className={buttonClass({ size: size === "sm" ? "sm" : "md", className: "shrink-0 rounded-l-none" })}
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
