import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { text, category, order, isActive } = body;

    const question = await prisma.question.update({
      where: { id },
      data: {
        ...(text !== undefined && { text }),
        ...(category !== undefined && { category }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error('PUT /api/questions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/questions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}