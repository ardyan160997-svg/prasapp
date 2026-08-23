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

export async function GET(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const householdId = getHouseholdId();

    const where: Record<string, unknown> = { householdId };
    if (status) where.status = status;

    const goals = await prisma.savingsGoal.findMany({
      where,
      include: { entries: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      goals: goals.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: Number(g.targetAmount),
        targetDate: g.targetDate,
        currentAmount: Number(g.currentAmount),
        status: g.status,
        note: g.note,
        progress: Number(g.targetAmount) > 0 ? (Number(g.currentAmount) / Number(g.targetAmount)) * 100 : 0,
        entries: g.entries.map((e) => ({
          id: e.id,
          amount: Number(e.amount),
          entryDate: e.entryDate,
          note: e.note,
          memberId: e.memberId,
        })),
      })),
    });
  } catch (error) {
    console.error("GET /api/tabungan error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, targetAmount, targetDate, note } = body;

    if (!name || !targetAmount || targetAmount <= 0) {
      return NextResponse.json({ error: "Nama dan target amount wajib diisi" }, { status: 400 });
    }

    const householdId = getHouseholdId();

    const goal = await prisma.savingsGoal.create({
      data: {
        householdId,
        name,
        targetAmount,
        targetDate: targetDate ? new Date(targetDate) : null,
        note: note || null,
        currentAmount: 0,
      },
      include: { entries: true },
    });

    return NextResponse.json({
      goal: {
        id: goal.id,
        name: goal.name,
        targetAmount: Number(goal.targetAmount),
        targetDate: goal.targetDate,
        currentAmount: Number(goal.currentAmount),
        status: goal.status,
        note: goal.note,
        progress: 0,
        entries: [],
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tabungan error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}