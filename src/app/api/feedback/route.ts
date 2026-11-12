import { NextResponse } from "next/server";
import { z } from "zod";
import { FEEDBACK_TYPES } from "@/lib/db-enums";
import { newId } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { forwardFeedbackToRevenueHog } from "@/lib/revenuehog";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  // D1 is SQLite and has no enum type, so this is the only thing constraining
  // the column. See src/lib/db-enums.ts.
  type: z.enum(FEEDBACK_TYPES),
  message: z.string().min(5).max(5000),
  page: z.string().max(500).optional(),
  // Lenient on purpose: a typo in an optional field must not 400 the request
  // and lose the message. An invalid value is dropped to undefined below.
  email: z.string().trim().max(320).optional(),
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Best-effort per-isolate token bucket keyed by client IP. It bounds a
// single-source flood without new infrastructure; for hard limits use a
// Cloudflare rate-limit binding.
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 5_000) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }
  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 },
    );
  }

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const email =
    parsed.data.email && EMAIL_RE.test(parsed.data.email)
      ? parsed.data.email
      : undefined;
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  const feedback = await prisma.feedback.create({
    data: {
      id: newId("fb"),
      type: parsed.data.type,
      message: parsed.data.message,
      page: parsed.data.page,
      email,
      userAgent,
    },
    select: { id: true },
  });

  // Best-effort copy to RevenueHog. The forwarder never throws, and the D1 row
  // above is the record, so a RevenueHog failure never fails the request.
  const revenueHog = await forwardFeedbackToRevenueHog({
    category: parsed.data.type,
    message: parsed.data.message,
    email,
    platform: "web",
    context: { feedbackId: feedback.id, page: parsed.data.page, userAgent },
  });
  if (!revenueHog.success) {
    console.warn("[feedback] revenuehog_forward_failed", { error: revenueHog.error });
  }

  return NextResponse.json({ id: feedback.id });
}
