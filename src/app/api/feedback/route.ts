import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  type: z.enum(["BUG", "FEATURE", "PRAISE", "OTHER"]),
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  const feedback = await prisma.feedback.create({
    data: {
      type: parsed.data.type,
      message: parsed.data.message,
      page: parsed.data.page,
      email: parsed.data.email,
      userAgent,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: feedback.id });
}
