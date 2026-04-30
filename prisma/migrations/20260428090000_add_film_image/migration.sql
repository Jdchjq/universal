-- CreateTable
CREATE TABLE "FilmImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filmId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'POSTER',
    "url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "language" TEXT,
    "voteAvg" REAL,
    "voteCount" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FilmImage_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
