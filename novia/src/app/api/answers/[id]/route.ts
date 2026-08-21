import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { answerText, questionText, questionCategory } = body;

    if (!answerText) {
      return NextResponse.json({ error: 'answerText is required' }, { status: 400 });
    }

    const answer = await prisma.answer.update({
      where: { id },
      data: {
        answerText,
        ...(questionText !== undefined && { questionTextSnapshot: questionText }),
        ...(questionCategory !== undefined && { questionCategorySnapshot: questionCategory }),
      },
      include: {
        question: {
          select: { text: true, category: true },
        },
      },
    });

    const normalizedAnswer = {
      ...answer,
      question: {
        text: answer.questionTextSnapshot,
        category: answer.questionCategorySnapshot,
      },
      liveQuestion: answer.question,
    };

    return NextResponse.json({ answer: normalizedAnswer });
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
