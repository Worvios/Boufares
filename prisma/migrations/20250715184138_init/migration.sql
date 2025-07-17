-- CreateTable
CREATE TABLE "Chantier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "responsable" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Fournisseur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom_fournisseur" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Besoin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chantierId" INTEGER NOT NULL,
    "fournisseurId" INTEGER NOT NULL,
    "prestation" TEXT NOT NULL,
    "montant_besoin" REAL NOT NULL,
    "date_besoin" DATETIME NOT NULL,
    "statut_urgence" TEXT NOT NULL,
    "commentaire" TEXT,
    CONSTRAINT "Besoin_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "Chantier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Besoin_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "besoinId" INTEGER NOT NULL,
    "date_paiement" DATETIME NOT NULL,
    "montant_regle" REAL NOT NULL,
    "type_recette" TEXT NOT NULL,
    "mois_concerne" TEXT NOT NULL,
    CONSTRAINT "Paiement_besoinId_fkey" FOREIGN KEY ("besoinId") REFERENCES "Besoin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
