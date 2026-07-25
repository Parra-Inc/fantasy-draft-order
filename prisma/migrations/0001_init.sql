-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "leagueName" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "creatorEmail" TEXT,
    "scheduledFor" DATETIME NOT NULL,
    "importSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "importLeagueId" TEXT,
    "seed" TEXT NOT NULL,
    "commitSha" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "draftId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerName" TEXT,
    "avatarUrl" TEXT,
    "sourceId" TEXT,
    "position" INTEGER NOT NULL,
    CONSTRAINT "Team_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "draftId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "pickNumber" INTEGER NOT NULL,
    "revealedAt" DATETIME NOT NULL,
    CONSTRAINT "Pick_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "page" TEXT,
    "email" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Draft_slug_key" ON "Draft"("slug");

-- CreateIndex
CREATE INDEX "Draft_scheduledFor_idx" ON "Draft"("scheduledFor");

-- CreateIndex
CREATE INDEX "Team_draftId_idx" ON "Team"("draftId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_draftId_position_key" ON "Team"("draftId", "position");

-- CreateIndex
CREATE INDEX "Pick_draftId_revealedAt_idx" ON "Pick"("draftId", "revealedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Pick_draftId_pickNumber_key" ON "Pick"("draftId", "pickNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Pick_draftId_teamId_key" ON "Pick"("draftId", "teamId");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE INDEX "Feedback_type_createdAt_idx" ON "Feedback"("type", "createdAt");
