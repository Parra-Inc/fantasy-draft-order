import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://fdo:fdo@localhost:5438/fantasy_draft_order?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const now = new Date();
  const scheduledFor = new Date(now.getTime() + 2 * 60 * 1000);

  const existing = await prisma.draft.findUnique({
    where: { slug: "demo-league" },
  });
  if (existing) {
    console.log("seed: demo draft already exists");
    return;
  }

  await prisma.draft.create({
    data: {
      slug: "demo-league",
      leagueName: "Demo Dynasty League",
      creatorName: "Seed Script",
      scheduledFor,
      importSource: "MANUAL",
      teams: {
        create: Array.from({ length: 10 }, (_, i) => ({
          name: `Team ${i + 1}`,
          ownerName: `Owner ${i + 1}`,
          position: i,
        })),
      },
    },
  });
  console.log("seed: created demo-league scheduled for", scheduledFor.toISOString());
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
