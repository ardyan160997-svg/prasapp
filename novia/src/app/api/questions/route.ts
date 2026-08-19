import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        text: true,
        category: true,
        order: true,
      },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('GET /api/questions error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, category, order } = body;

    if (!text || !category) {
      return NextResponse.json({ error: 'Text and category are required' }, { status: 400 });
    }

    const maxOrder = await prisma.question.aggregate({
      _max: { order: true },
    });

    const question = await prisma.question.create({
      data: {
        text,
        category,
        order: order ?? (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('POST /api/questions error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}