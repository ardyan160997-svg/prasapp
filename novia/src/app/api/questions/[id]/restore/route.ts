import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const question = await prisma.question.update({
      where: { id },
      data: { isActive: true },
    });

    return NextResponse.json({ question, restored: true });
  } catch (error) {
    console.error('POST /api/questions/[id]/restore error:', error);
    return NextResponse.json({ error: 'Failed to restore question' }, { status: 500 });
  }
}