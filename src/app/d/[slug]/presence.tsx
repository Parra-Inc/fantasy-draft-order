"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";

/**
 * "14 watching."
 *
 * Social proof at the only moment this product is a live event. Two things
 * come out of it: a countdown feels like something worth telling the league
 * chat to get into, and a draw with a dozen people watching visibly is a draw
 * nobody can later claim happened in private.
 *
 * The heartbeat stops while the tab is hidden, so a phone left on a desk for
 * an hour does not keep inflating the number.
 */

const BEAT_MS = 15_000;

export function ViewerCount({ slug }: { slug: string }) {
  const [count, setCount] = useState<number | null>(null);
  const viewerId = useRef<string | null>(null);

  useEffect(() => {
    // Per tab, not per person: two tabs counting twice is far less bad than
    // anything that would need to be stored to prevent it.
    viewerId.current ??=
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `v${Math.floor(Date.now() * Math.random()).toString(36)}`;

    let cancelled = false;

    async function beat() {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/drafts/${slug}/presence`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ viewerId: viewerId.current }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { count: number | null };
        if (!cancelled) setCount(data.count);
      } catch {
        // Offline or the object is unreachable. Keep the last known count.
      }
    }

    void beat();
    const id = setInterval(beat, BEAT_MS);
    // Coming back to the tab should update immediately, not up to 15s later.
    document.addEventListener("visibilitychange", beat);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [slug]);

  // One viewer is just you, and saying so is worse than saying nothing.
  if (count === null || count < 2) return null;

  return (
    <span
      className="border-signal/30 bg-signal/10 text-signal inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
      data-testid="viewer-count"
      data-count={count}
    >
      <Eye className="size-3" />
      {count} watching
    </span>
  );
}
