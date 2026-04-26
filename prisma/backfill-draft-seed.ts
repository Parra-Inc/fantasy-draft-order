import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * One-off backfill: assigns a random hex `seed` to any Draft rows where it is
 * NULL, so the `seed` column can be safely made non-nullable.
 *
 * Run against the target DB:
 *   DATABASE_URL="postgres://…" pnpm exec tsx prisma/backfill-draft-seed.ts
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const rows: { id: string }[] =
      await prisma.$queryRawUnsafe(`SELECT id FROM "Draft" WHERE seed IS NULL`);

    if (rows.length === 0) {
      console.log("backfill: no Draft rows with NULL seed — nothing to do");
      return;
    }

    console.log(`backfill: found ${rows.length} Draft row(s) with NULL seed`);

    for (const { id } of rows) {
      const seed = randomBytes(16).toString("hex");
      await prisma.$executeRawUnsafe(
        `UPDATE "Draft" SET seed = $1 WHERE id = $2 AND seed IS NULL`,
        seed,
        id,
      );
      console.log(`backfill: ${id} → ${seed}`);
    }

    console.log(`backfill: done (${rows.length} updated)`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
