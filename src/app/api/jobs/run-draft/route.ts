import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { z } from "zod";
import { runDraft } from "@/lib/run-draft";
import { env } from "@/lib/env";

const bodySchema = z.object({ draftId: z.string().min(1) });

async function handler(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const result = await runDraft(parsed.data.draftId);
  return NextResponse.json(result);
}

const hasSigningKeys =
  !!env.QSTASH_CURRENT_SIGNING_KEY && !!env.QSTASH_NEXT_SIGNING_KEY;

export const POST = hasSigningKeys
  ? verifySignatureAppRouter(handler)
  : handler;
