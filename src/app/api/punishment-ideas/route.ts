import { NextResponse } from "next/server";
import { z } from "zod";
import { PUNISHMENT_CATEGORIES } from "@/lib/db-enums";
import { newId } from "@/lib/ids";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Public submissions to the punishment ideas database.
 *
 * This is an unauthenticated write endpoint on an app that otherwise has none,
 * which is only acceptable because nothing lands publicly: every row starts
 * PENDING and /fantasy-football-punishments renders APPROVED only. The worst a
 * spammer achieves is rows nobody but the maintainer ever sees. There is no
 * throttle; if that ever becomes a problem the fix is a Cloudflare rate-limit
 * binding at the edge, not application code.
 *
 * Approval is manual SQL — see the punishment ideas section of CLAUDE.md.
 */
const bodySchema = z.object({
  label: z.string().min(3).max(120),
  category: z.enum(PUNISHMENT_CATEGORIES),
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

  const label = parsed.data.label.trim();
  if (label.length < 3) {
    return NextResponse.json({ error: "label too short" }, { status: 400 });
  }

  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  await prisma.punishmentIdea.create({
    data: {
      id: newId("pid"),
      label,
      category: parsed.data.category,
      // Explicit rather than relying on the column default, so the one thing
      // that keeps this endpoint safe is visible at the call site.
      status: "PENDING",
      email: parsed.data.email,
      userAgent,
    },
    select: { id: true },
  });

  // Deliberately does not return the id. There is nothing a submitter can do
  // with it, and echoing it back invites treating the row as public.
  return NextResponse.json({ ok: true });
}
