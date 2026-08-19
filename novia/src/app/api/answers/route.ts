import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, answerText } = body;

    if (!questionId || !answerText) {
      return NextResponse.json({ error: 'questionId and answerText are required' }, { status: 400 });
    }

    const answer = await prisma.answer.create({
      data: {
        questionId,
        answerText,
      },
    });

    return NextResponse.json({ answer }, { status: 201 });
  } catch (error) {
    console.error('POST /api/answers error:', error);
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const answers = await prisma.answer.findMany({
      include: {
        question: {
          select: { text: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ answers });
  } catch (error) {
    console.error('GET /api/answers error:', error);
    return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
  }
}