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
  email: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
});

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  const feedback = await prisma.feedback.create({
    data: {
      id: newId("fb"),
      type: parsed.data.type,
      message: parsed.data.message,
      page: parsed.data.page,
      email: parsed.data.email,
      userAgent,
    },
    select: { id: true },
  });

  // Best-effort copy to RevenueHog. The forwarder never throws, and the D1 row
  // above is the record, so a RevenueHog failure never fails the request.
  const revenueHog = await forwardFeedbackToRevenueHog({
    category: parsed.data.type,
    message: parsed.data.message,
    email: parsed.data.email,
    platform: "web",
    context: { feedbackId: feedback.id, page: parsed.data.page, userAgent },
  });
  if (!revenueHog.success) {
    console.warn("[feedback] revenuehog_forward_failed", { error: revenueHog.error });
  }

  return NextResponse.json({ id: feedback.id });
}
