import { PrismaClient, StatutUrgence, TypeRecette } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create Chantiers
  const chantiers = await Promise.all([
    prisma.chantier.create({ data: { nom: 'Chantier A', responsable: 'Jean Dupont', location: 'Casablanca' } }),
    prisma.chantier.create({ data: { nom: 'Chantier B', responsable: 'Marie Curie', location: 'Rabat' } }),
    prisma.chantier.create({ data: { nom: 'Chantier C', responsable: 'Ali Ben', location: 'Marrakech' } }),
    prisma.chantier.create({ data: { nom: 'Chantier D', responsable: 'Fatima Zahra', location: 'Tanger' } }),
    prisma.chantier.create({ data: { nom: 'Chantier E', responsable: 'Omar El Idrissi', location: 'Agadir' } }),
  ]);

  // Create Fournisseurs
  const fournisseurs = await Promise.all([
    prisma.fournisseur.create({ data: { nom_fournisseur: 'Fournisseur Alpha', type: 'Matériaux' } }),
    prisma.fournisseur.create({ data: { nom_fournisseur: 'Fournisseur Beta', type: 'Services' } }),
    prisma.fournisseur.create({ data: { nom_fournisseur: 'Fournisseur Gamma', type: 'Location' } }),
    prisma.fournisseur.create({ data: { nom_fournisseur: 'Fournisseur Delta', type: 'Transport' } }),
    prisma.fournisseur.create({ data: { nom_fournisseur: 'Fournisseur Epsilon', type: 'Main d’œuvre' } }),
  ]);

  // Create Besoins
  const besoins = await Promise.all([
    prisma.besoin.create({ data: { chantierId: chantiers[0].id, fournisseurId: fournisseurs[0].id, prestation: 'Ciment', montant_besoin: 5000, date_besoin: new Date('2024-07-01'), statut_urgence: StatutUrgence.URGENT, commentaire: 'Livraison rapide' } }),
    prisma.besoin.create({ data: { chantierId: chantiers[1].id, fournisseurId: fournisseurs[1].id, prestation: 'Main d’œuvre', montant_besoin: 8000, date_besoin: new Date('2024-07-10'), statut_urgence: StatutUrgence.NORMAL, commentaire: null } }),
    prisma.besoin.create({ data: { chantierId: chantiers[2].id, fournisseurId: fournisseurs[2].id, prestation: 'Gravier', montant_besoin: 3000, date_besoin: new Date('2024-06-15'), statut_urgence: StatutUrgence.URGENT, commentaire: 'Pour fondations' } }),
    prisma.besoin.create({ data: { chantierId: chantiers[3].id, fournisseurId: fournisseurs[3].id, prestation: 'Transport', montant_besoin: 2000, date_besoin: new Date('2024-05-20'), statut_urgence: StatutUrgence.NORMAL, commentaire: 'Camion 10T' } }),
    prisma.besoin.create({ data: { chantierId: chantiers[4].id, fournisseurId: fournisseurs[4].id, prestation: 'Peinture', montant_besoin: 1500, date_besoin: new Date('2024-08-01'), statut_urgence: StatutUrgence.URGENT, commentaire: 'Couleur blanche' } }),
    prisma.besoin.create({ data: { chantierId: chantiers[0].id, fournisseurId: fournisseurs[2].id, prestation: 'Location grue', montant_besoin: 7000, date_besoin: new Date('2024-07-15'), statut_urgence: StatutUrgence.NORMAL, commentaire: null } }),
    prisma.besoin.create({ data: { chantierId: chantiers[1].id, fournisseurId: fournisseurs[3].id, prestation: 'Transport matériaux', montant_besoin: 2500, date_besoin: new Date('2024-06-25'), statut_urgence: StatutUrgence.URGENT, commentaire: 'Livraison chantier B' } }),
    prisma.besoin.create({ data: { chantierId: chantiers[2].id, fournisseurId: fournisseurs[1].id, prestation: 'Services nettoyage', montant_besoin: 1200, date_besoin: new Date('2024-08-10'), statut_urgence: StatutUrgence.NORMAL, commentaire: null } }),
  ]);

  // Create Paiements (some besoins with multiple paiements, some with none)
  await Promise.all([
    prisma.paiement.create({ data: { besoinId: besoins[0].id, date_paiement: new Date('2024-07-05'), montant_regle: 2000, type_recette: TypeRecette.VIREMENT, mois_concerne: 'Juillet' } }),
    prisma.paiement.create({ data: { besoinId: besoins[0].id, date_paiement: new Date('2024-07-10'), montant_regle: 1000, type_recette: TypeRecette.CHEQUE, mois_concerne: 'Juillet' } }),
    prisma.paiement.create({ data: { besoinId: besoins[1].id, date_paiement: new Date('2024-07-15'), montant_regle: 3000, type_recette: TypeRecette.CHEQUE, mois_concerne: 'Juillet' } }),
    prisma.paiement.create({ data: { besoinId: besoins[2].id, date_paiement: new Date('2024-06-20'), montant_regle: 1500, type_recette: TypeRecette.ESPECES, mois_concerne: 'Juin' } }),
    prisma.paiement.create({ data: { besoinId: besoins[2].id, date_paiement: new Date('2024-06-25'), montant_regle: 1000, type_recette: TypeRecette.VIREMENT, mois_concerne: 'Juin' } }),
    prisma.paiement.create({ data: { besoinId: besoins[3].id, date_paiement: new Date('2024-05-25'), montant_regle: 2000, type_recette: TypeRecette.CHEQUE, mois_concerne: 'Mai' } }),
    prisma.paiement.create({ data: { besoinId: besoins[4].id, date_paiement: new Date('2024-08-05'), montant_regle: 1500, type_recette: TypeRecette.ESPECES, mois_concerne: 'Août' } }),
    prisma.paiement.create({ data: { besoinId: besoins[5].id, date_paiement: new Date('2024-07-20'), montant_regle: 4000, type_recette: TypeRecette.VIREMENT, mois_concerne: 'Juillet' } }),
    prisma.paiement.create({ data: { besoinId: besoins[5].id, date_paiement: new Date('2024-07-25'), montant_regle: 2000, type_recette: TypeRecette.CHEQUE, mois_concerne: 'Juillet' } }),
    prisma.paiement.create({ data: { besoinId: besoins[6].id, date_paiement: new Date('2024-06-28'), montant_regle: 2500, type_recette: TypeRecette.ESPECES, mois_concerne: 'Juin' } }),
    prisma.paiement.create({ data: { besoinId: besoins[7].id, date_paiement: new Date('2024-08-15'), montant_regle: 1200, type_recette: TypeRecette.VIREMENT, mois_concerne: 'Août' } }),
    // besoins[4] and besoins[7] have only one paiement, besoins[6] and besoins[3] are fully paid, besoins[1] and besoins[5] are partially paid, besoins[2] has multiple paiements, besoins[7] is unpaid
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 