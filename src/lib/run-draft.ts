import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { generateDraftOrder } from "./randomizer";
import { env } from "./env";

const PICK_INTERVAL_MS = 2000;
const FIRST_PICK_DELAY_MS = 1500;

export async function runDraft(draftId: string): Promise<{ ran: boolean; reason?: string }> {
  const draft = await prisma.draft.findUnique({
    where: { id: draftId },
    include: { teams: { orderBy: { position: "asc" } } },
  });
  if (!draft) return { ran: false, reason: "not found" };
  if (draft.status !== "SCHEDULED") return { ran: false, reason: `status=${draft.status}` };
  if (draft.teams.length < 2) return { ran: false, reason: "fewer than 2 teams" };

  const seed = randomBytes(16).toString("hex");
  const startedAt = new Date();

  const order = generateDraftOrder(draft.teams.map((t) => ({ teamId: t.id })));

  const picks = order.map((p, idx) => ({
    draftId: draft.id,
    teamId: p.teamId,
    pickNumber: p.pickNumber,
    revealedAt: new Date(startedAt.getTime() + FIRST_PICK_DELAY_MS + idx * PICK_INTERVAL_MS),
  }));

  const completedAt = new Date(
    picks[picks.length - 1].revealedAt.getTime() + 500,
  );

  await prisma.$transaction([
    prisma.draft.update({
      where: { id: draft.id },
      data: {
        status: "DRAWING",
        startedAt,
        seed,
        commitSha: env.VERCEL_GIT_COMMIT_SHA ?? null,
      },
    }),
    prisma.pick.createMany({ data: picks }),
    prisma.draft.update({
      where: { id: draft.id },
      data: { status: "COMPLETED", completedAt },
    }),
  ]);

  return { ran: true };
}
