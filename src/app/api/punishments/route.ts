import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ENTRY_SOURCES } from "@/lib/db-enums";
import { env } from "@/lib/env";
import { newId } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { cryptoRng, fisherYatesShuffle } from "@/lib/randomizer";
import { punishmentRevealedAt } from "@/lib/punishment-spin";
import { generateSlug } from "@/lib/slug";

// Reads and writes the database, so it can never be prerendered: the D1
// binding only exists inside a request.
export const dynamic = "force-dynamic";

/** Matches the max teams on a draft. Past this a wheel stops being readable. */
const MAX_OPTIONS = 24;

const bodySchema = z.object({
  leagueName: z.string().min(1).max(120),
  loserName: z.string().min(1).max(80),
  creatorName: z.string().min(1).max(80),
  creatorEmail: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  scheduledFor: z.string().datetime(),
  options: z.array(z.string().min(1).max(120)).min(2).max(MAX_OPTIONS),
  entrySource: z.enum(ENTRY_SOURCES).catch("DIRECT").optional(),
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
  const body = parsed.data;

  const scheduledFor = new Date(body.scheduledFor);
  if (scheduledFor.getTime() < Date.now() + 1_000) {
    return NextResponse.json(
      { error: "scheduledFor must be in the future" },
      { status: 400 },
    );
  }

  // Trim and de-duplicate case-insensitively before counting. Two options that
  // differ only in whitespace or capitalisation are one option as far as the
  // draw is concerned, and letting them through would quietly weight the wheel.
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const option of body.options) {
    const label = option.trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }
  if (labels.length < 2) {
    return NextResponse.json(
      { error: "at least 2 distinct punishments are required" },
      { status: 400 },
    );
  }

  const slug = generateSlug();
  const seed = randomBytes(16).toString("hex");
  // Depends on the option count: the reveal is the moment the last option is
  // struck out, so the wheel needs room to spin through all of them first.
  const revealedAt = punishmentRevealedAt(scheduledFor, labels.length);

  const punishmentId = newId("pun");
  const optionRows = labels.map((label, position) => ({
    id: newId("pop"),
    punishmentId,
    label,
    position,
  }));

  // The draw. Deliberately the same audited Fisher-Yates the draft order uses
  // rather than a bespoke "pick one of N": the results page links
  // src/lib/randomizer.ts at the exact commit, and that link only means
  // something if this is genuinely the code that ran. Position 0 of the shuffle
  // is the result; the rest of the permutation is discarded.
  const chosenPosition = fisherYatesShuffle(optionRows, cryptoRng)[0].position;

  // D1 has no interactive transactions, so everything is computed before the
  // first write and handed over as one atomic batch. Parent before children:
  // D1 enforces foreign keys.
  await prisma.$transaction([
    prisma.punishment.create({
      data: {
        id: punishmentId,
        slug,
        leagueName: body.leagueName,
        loserName: body.loserName,
        creatorName: body.creatorName,
        creatorEmail: body.creatorEmail,
        scheduledFor,
        revealedAt,
        chosenPosition,
        seed,
        commitSha: env.NEXT_PUBLIC_COMMIT_SHA ?? null,
        entrySource: body.entrySource ?? "DIRECT",
      },
    }),
    prisma.punishmentOption.createMany({ data: optionRows }),
  ]);

  return NextResponse.json({ slug });
}
