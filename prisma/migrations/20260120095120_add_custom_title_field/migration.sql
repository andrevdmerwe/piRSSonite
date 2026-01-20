-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Feed" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "folderId" INTEGER,
    "lastFetched" DATETIME,
    "nextCheckAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "customTitle" BOOLEAN NOT NULL DEFAULT false,
    "websubHub" TEXT,
    "websubTopic" TEXT,
    CONSTRAINT "Feed_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Feed" ("failureCount", "folderId", "id", "isAvailable", "lastFetched", "nextCheckAt", "order", "title", "url", "websubHub", "websubTopic") SELECT "failureCount", "folderId", "id", "isAvailable", "lastFetched", "nextCheckAt", "order", "title", "url", "websubHub", "websubTopic" FROM "Feed";
DROP TABLE "Feed";
ALTER TABLE "new_Feed" RENAME TO "Feed";
CREATE UNIQUE INDEX "Feed_url_key" ON "Feed"("url");
CREATE INDEX "Feed_nextCheckAt_idx" ON "Feed"("nextCheckAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
