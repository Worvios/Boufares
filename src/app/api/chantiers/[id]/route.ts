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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const chantier = await prisma.chantier.findUnique({
      where: { id: Number(id) },
      include: {
        besoins: {
          include: {
            fournisseur: true,
            paiements: true,
          },
        },
      },
    });
    if (!chantier) return NextResponse.json({ message: "Chantier non trouvé." }, { status: 404 });
    return NextResponse.json(chantier);
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la récupération du chantier." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const parsed = chantierSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0]?.message || 'Validation error.' }, { status: 400 });
    }
    const chantier = await prisma.chantier.update({ where: { id: Number(id) }, data: parsed.data });
    return NextResponse.json(chantier);
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la mise à jour du chantier." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.chantier.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Chantier supprimé." });
  } catch (error: any) {
    if (error.code === 'P2003' || (error.message && error.message.includes('FOREIGN KEY constraint failed'))) {
      return NextResponse.json({ message: "Impossible de supprimer ce chantier car il a des besoins associés." }, { status: 400 });
    }
    return NextResponse.json({ message: "Erreur lors de la suppression du chantier." }, { status: 400 });
  }
} 