import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.string().url().default("http://localhost:3042"),
  // Commit the deployed code was built from, used to link the randomizer
  // source at the exact SHA from every results page. Set by the deploy
  // workflow from github.sha. NEXT_PUBLIC_ so Next inlines it at build time,
  // which is the only moment the SHA is actually known.
  NEXT_PUBLIC_COMMIT_SHA: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

// No DATABASE_URL: the database is the Cloudflare D1 binding (see
// src/lib/prisma.ts), so there is no connection string to validate anywhere.
export const env = envSchema.parse({
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_COMMIT_SHA: process.env.NEXT_PUBLIC_COMMIT_SHA,
  NODE_ENV: process.env.NODE_ENV,
});

export const isDev = env.NODE_ENV !== "production";
