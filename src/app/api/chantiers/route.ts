import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schema for chantier
const chantierSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  responsable: z.string().min(1, 'Responsable requis'),
  location: z.string().min(1, 'Localisation requise'),
});

export async function GET() {
  try {
    const chantiers = await prisma.chantier.findMany();
    return NextResponse.json(chantiers);
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la récupération des chantiers." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const parsed = chantierSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || 'Validation error.' }, { status: 400 });
    }
    const chantier = await prisma.chantier.create({ data: parsed.data });
    return NextResponse.json(chantier, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du chantier:', error);
    return NextResponse.json({ message: "Erreur lors de la création du chantier." }, { status: 400 });
  }
} 