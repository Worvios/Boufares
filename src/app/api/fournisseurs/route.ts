import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schema for fournisseur
const fournisseurSchema = z.object({
  nom_fournisseur: z.string().min(1, 'Nom du fournisseur requis'),
  type: z.string().min(1, 'Type requis'),
});

export async function GET() {
  try {
    const fournisseurs = await prisma.fournisseur.findMany();
    return NextResponse.json(fournisseurs);
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la récupération des fournisseurs." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const parsed = fournisseurSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || 'Validation error.' }, { status: 400 });
    }
    const fournisseur = await prisma.fournisseur.create({ data: parsed.data });
    return NextResponse.json(fournisseur, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la création du fournisseur." }, { status: 400 });
  }
} 