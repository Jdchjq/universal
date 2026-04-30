-- RedefineTables
ALTER TABLE "Artist" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now'));
ALTER TABLE "Film" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now'));
