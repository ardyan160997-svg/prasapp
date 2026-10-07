import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyHouseholdAuth } from "@/lib/auth";

function getHouseholdId() {
  return "default-household";
}

async function checkAuth() {
  const authenticated = await verifyHouseholdAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, entryDate, note, memberId } = body;

    if (!amount || amount <= 0 || !memberId || !entryDate) {
      return NextResponse.json({ error: "Nominal, tanggal, dan member wajib diisi" }, { status: 400 });
    }

    const householdId = getHouseholdId();

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, householdId },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
    }

    const [entry] = await prisma.$transaction(async (tx) => {
      const created = await tx.savingsEntry.create({
        data: {
          householdId,
          savingsGoalId: id,
          memberId,
          amount,
          entryDate: new Date(entryDate),
          note: note || null,
        },
      });

      await tx.savingsGoal.update({
        where: { id },
        data: {
          currentAmount: Number(goal.currentAmount) + Number(amount),
        },
      });

      return [created];
    });

    return NextResponse.json({
      entry: {
        id: entry.id,
        amount: Number(entry.amount),
        entryDate: entry.entryDate,
        note: entry.note,
        memberId: entry.memberId,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tabungan/[id]/setoran error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("entryId");
    const { id } = await params;

    if (!entryId) {
      return NextResponse.json({ error: "entryId wajib diisi" }, { status: 400 });
    }

    const householdId = getHouseholdId();

    const entry = await prisma.savingsEntry.findFirst({
      where: { id: entryId, savingsGoalId: id, householdId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Setoran tidak ditemukan" }, { status: 404 });
    }

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, householdId },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.savingsEntry.delete({ where: { id: entryId } });
      await tx.savingsGoal.update({
        where: { id },
        data: {
          currentAmount: Math.max(0, Number(goal.currentAmount) - Number(entry.amount)),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tabungan/[id]/setoran error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}