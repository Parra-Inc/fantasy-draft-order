import { NextResponse } from "next/server";
import { allowRequest, unsubscribeBodySchema } from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST { token }. Always reports success for a well-formed token, known or
 * not, so it cannot be used to probe which tokens exist.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  if (!allowRequest(`unsubscribe:${ip}`, 10)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const parsed = unsubscribeBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid token is required." }, { status: 400 });
  }

  const now = new Date();
  await prisma.newsletterSubscriber.updateMany({
    where: { unsubscribeToken: parsed.data.token, isActive: true },
    data: { isActive: false, unsubscribedAt: now, updatedAt: now },
  });

  return NextResponse.json({ success: true });
}
