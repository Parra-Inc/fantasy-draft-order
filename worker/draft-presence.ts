import { DurableObject } from "cloudflare:workers";

/**
 * Live viewer count for one draft, as a Durable Object.
 *
 * One instance per slug (idFromName(slug)), so every viewer of the same draw
 * lands on the same object and the count is a real count rather than a
 * per-isolate guess.
 *
 * Why this is not a table in D1: presence is heartbeat traffic on a page that
 * already polls, and writing it to the drafts database would put a continuous
 * write load on the one thing in this app that must stay boring, in exchange
 * for durability that presence explicitly does not want. State here is
 * in-memory only. If the object is evicted the count restarts and refills
 * within one heartbeat, which is the correct behavior for "who is looking at
 * this right now" and is why nothing is persisted to storage.
 *
 * WHY THIS LIVES IN worker/ AND NOT src/
 * --------------------------------------
 * It imports "cloudflare:workers", which only resolves in the workerd build.
 * Everything under src/ is in the Next.js type graph, where that import does
 * not exist, so this sits next to custom-worker.ts (which re-exports it) and
 * is excluded from tsconfig for the same reason custom-worker.ts is. Wrangler
 * typechecks it at deploy.
 *
 * Extending DurableObject rather than declaring a bare class with a fetch()
 * method is not cosmetic: workerd warns at startup about namespaces whose
 * class does not extend it, and has signalled that it intends to make that a
 * hard startup error.
 */

/** How long a heartbeat keeps a viewer counted. Client beats every 15s. */
const VIEWER_TTL_MS = 45_000;

/**
 * Hard cap on tracked viewers. A draw is a dozen people; anything past this is
 * a script, and an unbounded Map in a long-lived object is how you turn a
 * counter into a memory leak.
 */
const MAX_VIEWERS = 5_000;

export class DraftPresence extends DurableObject {
  /** viewerId -> expiry timestamp in ms. */
  private viewers = new Map<string, number>();

  async fetch(request: Request): Promise<Response> {
    const now = Date.now();

    // Prune first, so an expired id never counts and never blocks the cap.
    for (const [id, expiresAt] of this.viewers) {
      if (expiresAt <= now) this.viewers.delete(id);
    }

    let viewerId: unknown;
    try {
      const body = (await request.json()) as { viewerId?: unknown };
      viewerId = body?.viewerId;
    } catch {
      viewerId = undefined;
    }

    if (
      typeof viewerId === "string" &&
      viewerId.length > 0 &&
      viewerId.length <= 64 &&
      (this.viewers.has(viewerId) || this.viewers.size < MAX_VIEWERS)
    ) {
      this.viewers.set(viewerId, now + VIEWER_TTL_MS);
    }

    return new Response(JSON.stringify({ count: this.viewers.size }), {
      headers: { "content-type": "application/json" },
    });
  }
}
