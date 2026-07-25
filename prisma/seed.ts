import { randomBytes } from "node:crypto";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { customAlphabet } from "nanoid";
import { requireLocalD1File } from "../scripts/local-d1.mjs";

/**
 * Seeds the LOCAL D1 database only.
 *
 * A plain node process has no Cloudflare binding, so this opens the miniflare
 * SQLite file directly instead of importing src/lib/prisma.ts. It is the same
 * file `wrangler d1 migrations apply --local` writes and `next dev` reads, so
 * the seed and the running app always agree.
 *
 * newId() is inlined rather than imported from src/lib/ids.ts because that
 * module sits behind the "@/" path alias, which does not resolve outside src/.
 */
const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 24);
const newId = (prefix: string) => `${prefix}_${nano()}`;

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: `file:${requireLocalD1File()}` }),
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
      id: newId("drf"),
      slug: "demo-league",
      leagueName: "Demo Dynasty League",
      creatorName: "Seed Script",
      scheduledFor,
      importSource: "MANUAL",
      seed: randomBytes(16).toString("hex"),
      teams: {
        create: Array.from({ length: 10 }, (_, i) => ({
          id: newId("tm"),
          name: `Team ${i + 1}`,
          ownerName: `Owner ${i + 1}`,
          position: i,
        })),
      },
    },
  });

  // No picks on purpose: the demo draft sits in SCHEDULED so `pnpm dev` opens
  // on the pre-draw state. Create one through /new to exercise the live draw.
  console.log(
    "seed: created demo-league scheduled for",
    scheduledFor.toISOString(),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
