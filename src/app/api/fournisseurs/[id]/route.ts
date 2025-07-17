import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schema for fournisseur
const fournisseurSchema = z.object({
  nom_fournisseur: z.string().min(1, 'Nom du fournisseur requis'),
  type: z.string().min(1, 'Type requis'),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const fournisseur = await prisma.fournisseur.findUnique({ where: { id: Number(id) } });
    if (!fournisseur) return NextResponse.json({ message: "Fournisseur non trouvé." }, { status: 404 });
    return NextResponse.json(fournisseur);
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la récupération du fournisseur." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const parsed = fournisseurSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || 'Validation error.' }, { status: 400 });
    }
    const fournisseur = await prisma.fournisseur.update({ where: { id: Number(id) }, data: parsed.data });
    return NextResponse.json(fournisseur);
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la mise à jour du fournisseur." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.fournisseur.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Fournisseur supprimé." });
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la suppression du fournisseur." }, { status: 400 });
  }
} 