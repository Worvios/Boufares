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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const paiement = await prisma.paiement.findUnique({
      where: { id: Number(id) },
      include: { besoin: { include: { chantier: true } } },
    });
    if (!paiement) return NextResponse.json({ message: "Paiement non trouvé." }, { status: 404 });
    return NextResponse.json(paiement);
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la récupération du paiement." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const parsed = paiementSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || 'Validation error.' }, { status: 400 });
    }
    const paiement = await prisma.paiement.update({ where: { id: Number(id) }, data: parsed.data });
    return NextResponse.json(paiement);
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la mise à jour du paiement." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.paiement.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Paiement supprimé." });
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la suppression du paiement." }, { status: 400 });
  }
} 