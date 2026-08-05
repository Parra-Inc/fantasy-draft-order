import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializePunishmentState } from "@/lib/punishment-state";

// Polled by every viewer while the wheel spins, and the D1 binding only exists
// inside a request: never cache or prerender this.
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const punishment = await prisma.punishment.findUnique({
    where: { slug },
    include: { options: { orderBy: { position: "asc" } } },
  });
  if (!punishment) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // serializePunishmentState owns the "no result before revealedAt" rule. Do
  // not read punishment.chosenPosition here.
  const state = serializePunishmentState(punishment);

  // No IndexNow ping here, for the same reason as the draft state endpoint:
  // this is polled by every viewer while the wheel spins, and submitting from
  // a read path rate limits the submitter instead of indexing anything. A
  // revealed wheel reaches engines through sitemap.xml.

  return NextResponse.json(state);
}
