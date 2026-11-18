import { NextResponse } from "next/server";
import { newId } from "@/lib/ids";
import { allowRequest, subscribeBodySchema } from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Idempotent: a repeat signup, or a signup after unsubscribing, succeeds and
 * reactivates the row, so the form never reveals who is already on the list.
 * The unsubscribe token and subscribedAt are kept on conflict so old email
 * links keep working.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  if (!allowRequest(`subscribe:${ip}`)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const parsed = subscribeBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const { email, source, website } = parsed.data;
  if (website) return NextResponse.json({ subscribed: true }); // bot: same answer, no write

  // A single-unique-field upsert with no nested writes compiles to one
  // INSERT ... ON CONFLICT on SQLite, so concurrent posts cannot race.
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: {
      id: newId("sub"),
      email,
      source: source || null,
      unsubscribeToken: crypto.randomUUID(),
    },
    update: {
      isActive: true,
      unsubscribedAt: null,
      updatedAt: new Date(),
      ...(source ? { source } : {}),
    },
  });

  return NextResponse.json({ subscribed: true }, { status: 201 });
}
