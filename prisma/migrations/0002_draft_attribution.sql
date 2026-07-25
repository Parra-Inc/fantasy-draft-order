-- Viral attribution on Draft.
--
-- Hand-written rather than generated: `prisma migrate diff --from-local-d1`
-- was removed in Prisma 7, so scripts/d1-migration-new.sh cannot produce this.
-- Both columns are additive and nullable-or-defaulted, which is the one shape
-- SQLite's ALTER TABLE can do without a table rebuild.

-- AlterTable
ALTER TABLE "Draft" ADD COLUMN "referrerSlug" TEXT;
ALTER TABLE "Draft" ADD COLUMN "entrySource" TEXT NOT NULL DEFAULT 'DIRECT';

-- CreateIndex
CREATE INDEX "Draft_referrerSlug_idx" ON "Draft"("referrerSlug");
