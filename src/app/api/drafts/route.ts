import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/slug";
import { scheduleDraft } from "@/lib/qstash";
import { getImporter } from "@/lib/importers";

const teamInput = z.object({
  name: z.string().min(1).max(80),
  ownerName: z.string().max(80).optional(),
  avatarUrl: z.string().url().optional(),
});

const importInput = z.object({
  source: z.enum(["SLEEPER", "MFL", "FLEAFLICKER", "ESPN"]),
  leagueId: z.string().min(1).max(80),
});

const bodySchema = z
  .object({
    leagueName: z.string().min(1).max(120),
    creatorName: z.string().min(1).max(80),
    creatorEmail: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
    scheduledFor: z.string().datetime(),
    teams: z.array(teamInput).min(2).max(32).optional(),
    import: importInput.optional(),
  })
  .refine((v) => v.teams || v.import, {
    message: "Either teams[] or import is required",
  });

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const scheduledFor = new Date(body.scheduledFor);
  if (scheduledFor.getTime() < Date.now() + 30_000) {
    return NextResponse.json(
      { error: "scheduledFor must be at least 30 seconds in the future" },
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
  let importSource: "SLEEPER" | "MFL" | "FLEAFLICKER" | "ESPN" | "MANUAL" = "MANUAL";
  let importLeagueId: string | undefined;

  if (body.import) {
    try {
      const imported = await getImporter(body.import.source).fetchLeague(body.import.leagueId);
      if (imported.teams.length < 2) {
        return NextResponse.json({ error: "imported league has fewer than 2 teams" }, { status: 400 });
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
  const draft = await prisma.draft.create({
    data: {
      slug,
      leagueName: body.leagueName,
      creatorName: body.creatorName,
      creatorEmail: body.creatorEmail,
      scheduledFor,
      importSource,
      importLeagueId,
      teams: {
        create: teams.map((t, i) => ({
          name: t.name,
          ownerName: t.ownerName,
          avatarUrl: t.avatarUrl,
          sourceId: t.sourceId,
          position: i,
        })),
      },
    },
  });

  const schedule = await scheduleDraft(draft.id, scheduledFor);
  if (schedule.scheduled) {
    await prisma.draft.update({
      where: { id: draft.id },
      data: { qstashMessageId: schedule.messageId },
    });
  }

  return NextResponse.json({ slug: draft.slug, scheduled: schedule.scheduled });
}
