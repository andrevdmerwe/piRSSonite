-- CreateTable
CREATE TABLE "WebSubSubscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "feedId" INTEGER NOT NULL,
    "hubUrl" TEXT NOT NULL,
    "topicUrl" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "leaseSeconds" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastError" TEXT,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WebSubSubscription_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WebSubSubscription_feedId_key" ON "WebSubSubscription"("feedId");

-- CreateIndex
CREATE INDEX "WebSubSubscription_expiresAt_isActive_idx" ON "WebSubSubscription"("expiresAt", "isActive");

-- CreateIndex
CREATE INDEX "WebSubSubscription_feedId_idx" ON "WebSubSubscription"("feedId");
