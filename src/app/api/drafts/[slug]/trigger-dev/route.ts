import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runDraft } from "@/lib/run-draft";
import { isDev } from "@/lib/env";

export async function POST(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  if (!isDev) return NextResponse.json({ error: "dev only" }, { status: 403 });
  const { slug } = await ctx.params;
  const draft = await prisma.draft.findUnique({ where: { slug } });
  if (!draft) return NextResponse.json({ error: "not found" }, { status: 404 });
  const result = await runDraft(draft.id);
  return NextResponse.json(result);
}
