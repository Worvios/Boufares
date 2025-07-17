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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const besoin = await prisma.besoin.findUnique({
      where: { id: Number(id) },
      include: { chantier: true, fournisseur: true, paiements: true },
    });
    if (!besoin) return NextResponse.json({ message: "Besoin non trouvé." }, { status: 404 });
    return NextResponse.json(besoin);
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la récupération du besoin." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const parsed = besoinSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || 'Validation error.' }, { status: 400 });
    }
    const besoin = await prisma.besoin.update({ where: { id: Number(id) }, data: parsed.data });
    return NextResponse.json(besoin);
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la mise à jour du besoin." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.besoin.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Besoin supprimé." });
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la suppression du besoin." }, { status: 400 });
  }
} 