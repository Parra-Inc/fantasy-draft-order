import "dotenv/config";
import type { PrismaConfig } from "prisma";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://fdo:fdo@localhost:5438/fantasy_draft_order?schema=public";

export default {
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "pnpm exec tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
} satisfies PrismaConfig;
