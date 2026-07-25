import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ENTRY_SOURCES,
  IMPORTABLE_SOURCES,
  type ImportSource,
} from "@/lib/db-enums";
import { env } from "@/lib/env";
import { newId } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { generateDraftOrder } from "@/lib/randomizer";
import { getRevealConfig, pickRevealedAt } from "@/lib/reveal";
import { getImporter } from "@/lib/importers";

// The database is D1 (SQLite), which has no enum type and no interactive
// transactions. This route is where both of those show up: importSource is
// validated here rather than by the column, and the whole draft is written as
// one pre-computed $transaction([...]) batch.
export const dynamic = "force-dynamic";

const teamInput = z.object({
  name: z.string().min(1).max(80),
  ownerName: z.string().max(80).optional(),
  avatarUrl: z.string().url().optional(),
});

const importInput = z.object({
  source: z.enum(IMPORTABLE_SOURCES),
  leagueId: z.string().min(1).max(80),
});

const bodySchema = z
  .object({
    leagueName: z.string().min(1).max(120),
    creatorName: z.string().min(1).max(80),
    creatorEmail: z
      .string()
      .email()
      .optional()
      .or(z.literal(""))
      .transform((v) => v || undefined),
    scheduledFor: z.string().datetime(),
    teams: z.array(teamInput).min(2).max(32).optional(),
    import: importInput.optional(),
    // Attribution. Both are advisory: a bad value degrades to "we don't know
    // where this came from" rather than a 400, because losing a draft over a
    // mangled tracking param would be an absurd trade.
    referrerSlug: z.string().max(64).optional(),
    entrySource: z.enum(ENTRY_SOURCES).catch("DIRECT").optional(),
  })
  .refine((v) => v.teams || v.import, {
    message: "Either teams[] or import is required",
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

  type TeamInput = {
    name: string;
    ownerName?: string;
    avatarUrl?: string;
    sourceId?: string;
  };
  let teams: TeamInput[] | undefined = body.teams;
  let importSource: ImportSource = "MANUAL";
  let importLeagueId: string | undefined;

  if (body.import) {
    try {
      const imported = await getImporter(body.import.source).fetchLeague(
        body.import.leagueId,
      );
      if (imported.teams.length < 2) {
        return NextResponse.json(
          { error: "imported league has fewer than 2 teams" },
          { status: 400 },
        );
      }
      teams = imported.teams;
      importSource = body.import.source;
      importLeagueId = body.import.leagueId;
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "import failed" },
        { status: 400 },
      );
    }
  }

  if (!teams) return NextResponse.json({ error: "no teams" }, { status: 400 });

  const slug = generateSlug();
  const seed = randomBytes(16).toString("hex");
  const revealConfig = getRevealConfig();

  // Only record a referrer that resolves to a real draft, so the column can be
  // joined against Draft.slug without filtering junk. A miss is not an error:
  // the param is user-supplied and the draft it named may since have been
  // removed, neither of which should block a create.
  let referrerSlug: string | null = null;
  if (body.referrerSlug) {
    const referrer = await prisma.draft
      .findUnique({
        where: { slug: body.referrerSlug },
        select: { slug: true },
      })
      .catch(() => null);
    referrerSlug = referrer?.slug ?? null;
  }

  // D1 has no interactive transactions, so the entire draft is computed before
  // anything is written and handed to $transaction() as an array, which the D1
  // adapter sends as a single atomic batch. Generating the ids up front (rather
  // than letting the database mint them, as Postgres used to) is what makes
  // that possible: the picks already know their teamId before the teams exist.
  //
  // Statement order matters — D1 enforces foreign keys, so teams must land
  // before the picks that reference them.
  const draftId = newId("drf");

  const teamRows = teams.map((t, i) => ({
    id: newId("tm"),
    draftId,
    name: t.name,
    ownerName: t.ownerName ?? null,
    avatarUrl: t.avatarUrl ?? null,
    sourceId: t.sourceId ?? null,
    position: i,
  }));

  const order = generateDraftOrder(teamRows.map((t) => ({ teamId: t.id })));

  const pickRows = order.map((p) => ({
    id: newId("pck"),
    draftId,
    teamId: p.teamId,
    pickNumber: p.pickNumber,
    revealedAt: pickRevealedAt(
      scheduledFor,
      order.length - p.pickNumber,
      revealConfig,
    ),
  }));

  await prisma.$transaction([
    prisma.draft.create({
      data: {
        id: draftId,
        slug,
        leagueName: body.leagueName,
        creatorName: body.creatorName,
        creatorEmail: body.creatorEmail,
        scheduledFor,
        importSource,
        importLeagueId,
        seed,
        commitSha: env.NEXT_PUBLIC_COMMIT_SHA ?? null,
        referrerSlug,
        entrySource: body.entrySource ?? "DIRECT",
      },
    }),
    prisma.team.createMany({ data: teamRows }),
    prisma.pick.createMany({ data: pickRows }),
  ]);

  return NextResponse.json({ slug });
}
