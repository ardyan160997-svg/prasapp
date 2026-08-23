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
    const sourceType = searchParams.get("sourceType");
    const sourcePlanId = searchParams.get("sourcePlanId");

    const householdId = getHouseholdId();

    const where: Record<string, unknown> = { householdId };
    if (status) where.status = status;
    if (sourceType) where.sourceType = sourceType;
    if (sourcePlanId) where.sourcePlanId = sourcePlanId;

    const goals = await prisma.savingsGoal.findMany({
      where,
      include: { entries: true, sourcePlan: true },
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
        sourceType: g.sourceType,
        sourcePlanId: g.sourcePlanId,
        sourcePlan: g.sourcePlan
          ? {
              id: g.sourcePlan.id,
              title: g.sourcePlan.title,
              estimatedAmount: Number(g.sourcePlan.estimatedAmount),
            }
          : null,
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
    const { name, targetAmount, targetDate, note, sourceType, sourcePlanId } = body;

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
        sourceType: sourceType || "GENERAL",
        sourcePlanId: sourcePlanId || null,
        currentAmount: 0,
      },
      include: { entries: true, sourcePlan: true },
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
        sourceType: goal.sourceType,
        sourcePlanId: goal.sourcePlanId,
        sourcePlan: goal.sourcePlan
          ? {
              id: goal.sourcePlan.id,
              title: goal.sourcePlan.title,
              estimatedAmount: Number(goal.sourcePlan.estimatedAmount),
            }
          : null,
        progress: 0,
        entries: [],
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tabungan error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}