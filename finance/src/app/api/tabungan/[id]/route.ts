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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const householdId = getHouseholdId();

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, householdId },
      include: { entries: { orderBy: { entryDate: "desc" } } },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      goal: {
        id: goal.id,
        name: goal.name,
        targetAmount: Number(goal.targetAmount),
        targetDate: goal.targetDate,
        currentAmount: Number(goal.currentAmount),
        status: goal.status,
        note: goal.note,
        progress: Number(goal.targetAmount) > 0 ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0,
        entries: goal.entries.map((e) => ({
          id: e.id,
          amount: Number(e.amount),
          entryDate: e.entryDate,
          note: e.note,
          memberId: e.memberId,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/tabungan/[id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, targetAmount, targetDate, note, status } = body;

    const householdId = getHouseholdId();

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, householdId },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        name: name ?? goal.name,
        targetAmount: targetAmount ?? goal.targetAmount,
        targetDate: targetDate ? new Date(targetDate) : goal.targetDate,
        note: note ?? goal.note,
        status: status ?? goal.status,
      },
      include: { entries: true },
    });

    return NextResponse.json({
      goal: {
        id: updated.id,
        name: updated.name,
        targetAmount: Number(updated.targetAmount),
        targetDate: updated.targetDate,
        currentAmount: Number(updated.currentAmount),
        status: updated.status,
        note: updated.note,
        progress: Number(updated.targetAmount) > 0 ? (Number(updated.currentAmount) / Number(updated.targetAmount)) * 100 : 0,
        entries: updated.entries.map((e) => ({
          id: e.id,
          amount: Number(e.amount),
          entryDate: e.entryDate,
          note: e.note,
          memberId: e.memberId,
        })),
      },
    });
  } catch (error) {
    console.error("PUT /api/tabungan/[id] error:", error);
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
    const { id } = await params;
    const householdId = getHouseholdId();

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, householdId },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal tidak ditemukan" }, { status: 404 });
    }

    await prisma.savingsGoal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tabungan/[id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}