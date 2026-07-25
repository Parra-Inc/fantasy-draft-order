import { NextResponse } from "next/server";
import { submitCompletedWheel } from "@/lib/indexnow";
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

  // The page flips from noindex to indexable the moment the wheel lands, and
  // pollers watching it are usually the first to see that. Fire-and-forget.
  if (state.status === "COMPLETED") {
    submitCompletedWheel(punishment.slug, punishment.revealedAt);
  }

  return NextResponse.json(state);
}
