"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../src/generated/prisma");
const prisma = new prisma_1.PrismaClient();
async function main() {
    // Create Chantiers
    const chantier1 = await prisma.chantier.create({
        data: {
            nom: 'Chantier A',
            responsable: 'Jean Dupont',
        },
    });
    const chantier2 = await prisma.chantier.create({
        data: {
            nom: 'Chantier B',
            responsable: 'Marie Curie',
        },
    });
    // Create Fournisseurs
    const fournisseur1 = await prisma.fournisseur.create({
        data: {
            nom_fournisseur: 'Fournisseur Alpha',
            type: 'Matériaux',
        },
    });
    const fournisseur2 = await prisma.fournisseur.create({
        data: {
            nom_fournisseur: 'Fournisseur Beta',
            type: 'Services',
        },
    });
    // Create Besoins
    const besoin1 = await prisma.besoin.create({
        data: {
            chantierId: chantier1.id,
            fournisseurId: fournisseur1.id,
            prestation: 'Ciment',
            montant_besoin: 5000,
            date_besoin: new Date('2024-07-01'),
            statut_urgence: prisma_1.StatutUrgence.URGENT,
            commentaire: 'Livraison rapide',
        },
    });
    const besoin2 = await prisma.besoin.create({
        data: {
            chantierId: chantier2.id,
            fournisseurId: fournisseur2.id,
            prestation: 'Main d’œuvre',
            montant_besoin: 8000,
            date_besoin: new Date('2024-07-10'),
            statut_urgence: prisma_1.StatutUrgence.NORMAL,
            commentaire: null,
        },
    });
    // Create Paiements
    await prisma.paiement.create({
        data: {
            besoinId: besoin1.id,
            date_paiement: new Date('2024-07-05'),
            montant_regle: 2000,
            type_recette: prisma_1.TypeRecette.VIREMENT,
            mois_concerne: 'Juillet',
        },
    });
    await prisma.paiement.create({
        data: {
            besoinId: besoin2.id,
            date_paiement: new Date('2024-07-15'),
            montant_regle: 3000,
            type_recette: prisma_1.TypeRecette.CHEQUE,
            mois_concerne: 'Juillet',
        },
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
