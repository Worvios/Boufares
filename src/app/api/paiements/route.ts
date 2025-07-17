import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schema for paiement
const paiementSchema = z.object({
  besoinId: z.number().int().positive(),
  montant_regle: z.number().positive(),
  mois_concerne: z.string().min(1),
  type_recette: z.enum(['VIREMENT', 'CHEQUE', 'ESPECES']),
  date_paiement: z.coerce.date(),
});

export async function GET() {
  try {
    const paiements = await prisma.paiement.findMany({
      include: { besoin: { include: { chantier: true } } },
    });
    return NextResponse.json(paiements);
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la récupération des paiements." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const parsed = paiementSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || 'Validation error.' }, { status: 400 });
    }
    const paiement = await prisma.paiement.create({ data: parsed.data });
    return NextResponse.json(paiement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la création du paiement." }, { status: 400 });
  }
} 