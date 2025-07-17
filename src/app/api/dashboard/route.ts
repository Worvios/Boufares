import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Parse filters from query params
    const { searchParams } = new URL(req.url);
    const chantierId = searchParams.get('chantierId');
    const fournisseurId = searchParams.get('fournisseurId');
    const urgence = searchParams.get('urgence');
    const mois = searchParams.get('mois'); // format: YYYY-MM

    // Build where clause for besoins
    const where: any = {};
    if (chantierId) where.chantierId = Number(chantierId);
    if (fournisseurId) where.fournisseurId = Number(fournisseurId);
    if (urgence) where.statut_urgence = urgence;
    if (mois) {
      // Filter by month (date_besoin)
      const [year, month] = mois.split('-');
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      where.date_besoin = { gte: start, lt: end };
    }

    // Counts (unfiltered for global context)
    const [chantiersCount, fournisseursCount, besoinsCount, paiementsCount] = await Promise.all([
      prisma.chantier.count(),
      prisma.fournisseur.count(),
      prisma.besoin.count(),
      prisma.paiement.count(),
    ]);

    // Filtered besoins
    const besoins = await prisma.besoin.findMany({
      where,
      include: { paiements: true, chantier: true, fournisseur: true },
    });
    const totalBesoins = besoins.reduce((sum, b) => sum + b.montant_besoin, 0);
    const totalPayes = besoins.reduce((sum, b) => sum + b.paiements.reduce((s, p) => s + p.montant_regle, 0), 0);
    const totalSoldes = besoins.reduce((sum, b) => sum + (b.montant_besoin - b.paiements.reduce((s, p) => s + p.montant_regle, 0)), 0);

    // Top 5 urgent besoins (filtered)
    const topUrgentBesoins = besoins
      .filter(b => b.statut_urgence === 'URGENT')
      .map(b => ({
        id: b.id,
        chantier: b.chantier?.nom,
        fournisseur: b.fournisseur?.nom_fournisseur,
        prestation: b.prestation,
        montant_besoin: b.montant_besoin,
        montant_regle: b.paiements.reduce((s, p) => s + p.montant_regle, 0),
        solde: b.montant_besoin - b.paiements.reduce((s, p) => s + p.montant_regle, 0),
        statut_urgence: b.statut_urgence,
        date_besoin: b.date_besoin,
        commentaire: b.commentaire,
      }))
      .sort((a, b) => b.solde - a.solde)
      .slice(0, 5);

    // Recent payments (last 5)
    const recentPaiements = await prisma.paiement.findMany({
      orderBy: { date_paiement: 'desc' },
      take: 5,
      include: {
        besoin: {
          include: { chantier: true, fournisseur: true }
        }
      }
    });
    // Recent chantiers (last 5)
    const recentChantiers = await prisma.chantier.findMany({
      orderBy: { id: 'desc' },
      take: 5,
    });

    // Chart: Répartition des besoins par chantier
    const besoinsParChantier: Record<string, number> = {};
    besoins.forEach(b => {
      const chantier = b.chantier?.nom || 'Inconnu';
      besoinsParChantier[chantier] = (besoinsParChantier[chantier] || 0) + b.montant_besoin;
    });

    // Chart: Répartition des paiements par type
    const paiements = besoins.flatMap(b => b.paiements);
    const paiementsParType: Record<string, number> = {};
    paiements.forEach(p => {
      const type = p.type_recette || 'Inconnu';
      paiementsParType[type] = (paiementsParType[type] || 0) + p.montant_regle;
    });

    // Chart: Evolution des paiements par mois
    const paiementsParMois: Record<string, number> = {};
    paiements.forEach(p => {
      if (p.date_paiement) {
        const d = new Date(p.date_paiement);
        const m = d.toISOString().slice(0, 7); // YYYY-MM
        paiementsParMois[m] = (paiementsParMois[m] || 0) + p.montant_regle;
      }
    });

    return NextResponse.json({
      chantiersCount,
      fournisseursCount,
      besoinsCount,
      paiementsCount,
      totalBesoins,
      totalPayes,
      totalSoldes,
      topUrgentBesoins,
      recentPaiements,
      recentChantiers,
      chartData: {
        besoinsParChantier,
        paiementsParType,
        paiementsParMois,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la récupération des statistiques du dashboard." }, { status: 500 });
  }
} 