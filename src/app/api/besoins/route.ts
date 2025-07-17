import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schema for besoin
const besoinSchema = z.object({
  chantierId: z.number().int().positive(),
  fournisseurId: z.number().int().positive(),
  prestation: z.string().min(1),
  montant_besoin: z.number().positive(),
  statut_urgence: z.enum(['URGENT', 'NORMAL']),
  commentaire: z.string().optional(),
  date_besoin: z.coerce.date(),
});

export async function GET() {
  try {
    const besoins = await prisma.besoin.findMany({
      include: { chantier: true, fournisseur: true, paiements: true },
    });
    return NextResponse.json(besoins);
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la récupération des besoins." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const parsed = besoinSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || 'Validation error.' }, { status: 400 });
    }
    const besoin = await prisma.besoin.create({ data: parsed.data });
    return NextResponse.json(besoin, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la création du besoin." }, { status: 400 });
  }
} 