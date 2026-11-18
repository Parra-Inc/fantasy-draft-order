"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

/**
 * Unsubscribing takes a click that POSTs the token: a GET that unsubscribed
 * would be triggered by link scanners and prefetch.
 */
export function UnsubscribeConfirm({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");

  if (!token) {
    return (
      <p className="text-hashmark mt-4">
        This link is missing its token. Use the unsubscribe link from any of our emails.
      </p>
    );
  }

  if (state === "done") {
    return (
      <div role="status" className="mt-4">
        <p className="text-hashmark">You&apos;re unsubscribed. You won&apos;t get any more newsletter emails.</p>
        <p className="text-hashmark mt-4 text-sm">
          Changed your mind?{" "}
          <Link href="/#newsletter" className="text-signal hover:underline">
            Subscribe again
          </Link>
          .
        </p>
      </div>
    );
  }

  async function confirm() {
    setState("pending");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mt-4">
      <p className="text-hashmark">Stop getting the Fantasy Football Draft Order newsletter?</p>
      <button
        type="button"
        onClick={confirm}
        disabled={state === "pending"}
        aria-busy={state === "pending" || undefined}
        className={buttonClass({ className: "mt-6" })}
      >
        {state === "pending" ? "Unsubscribing…" : "Unsubscribe"}
      </button>
      {state === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          Something went wrong. Try again.
        </p>
      )}
    </div>
  );
}
