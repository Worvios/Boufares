/*
  Warnings:

  - Added the required column `location` to the `Chantier` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chantier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "responsable" TEXT NOT NULL,
    "location" TEXT NOT NULL
);
INSERT INTO "new_Chantier" ("id", "nom", "responsable") SELECT "id", "nom", "responsable" FROM "Chantier";
DROP TABLE "Chantier";
ALTER TABLE "new_Chantier" RENAME TO "Chantier";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
