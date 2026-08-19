import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { answerText } = body;

    if (!answerText) {
      return NextResponse.json({ error: 'answerText is required' }, { status: 400 });
    }

    const answer = await prisma.answer.update({
      where: { id },
      data: { answerText },
      include: {
        question: {
          select: { text: true, category: true },
        },
      },
    });

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('PUT /api/answers/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update answer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.answer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/answers/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete answer' }, { status: 500 });
  }
}
