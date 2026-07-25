import { NextResponse } from "next/server";
import { z } from "zod";
import { cfEnv } from "@/lib/cloudflare/context";

// Talks to a binding, which only exists inside a request.
export const dynamic = "force-dynamic";

/**
 * Heartbeat for the live viewer count.
 *
 * Deliberately separate from the state endpoint rather than folded into it:
 * state is polled twice a second during a draw, and a Durable Object round
 * trip on that path would add latency to the one request whose timing the
 * whole animation depends on. Presence beats every 15 seconds instead.
 *
 * The viewer id is generated and held client-side for the tab's lifetime. It
 * is not a user id, is never persisted, and is never written to the database:
 * it exists only so the object can tell two tabs apart within a 45s window.
 */

const bodySchema = z.object({ viewerId: z.string().min(1).max(64) });

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const namespace = cfEnv()?.DRAFT_PRESENCE;
  // No binding means `next dev` without Workers, or a preview built before the
  // DO shipped. A null count renders nothing rather than breaking the page.
  if (!namespace) return NextResponse.json({ count: null });

  try {
    const stub = namespace.get(namespace.idFromName(slug));
    const res = await stub.fetch("https://draft-presence.internal/beat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ viewerId: parsed.data.viewerId }),
    });
    const data = (await res.json()) as { count?: number };
    return NextResponse.json({ count: data.count ?? null });
  } catch {
    // Presence is decoration on a page whose actual job is the draw. If the
    // object is unreachable, say nothing rather than surface an error.
    return NextResponse.json({ count: null });
  }
}
