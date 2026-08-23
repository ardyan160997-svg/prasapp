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
    const priority = searchParams.get("priority");

    const householdId = getHouseholdId();

    const where: Record<string, unknown> = { householdId };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const plans = await prisma.financialPlan.findMany({
      where,
      include: {
        linkedSavingsGoal: true,
        savingsGoals: {
          include: {
            entries: {
              orderBy: { entryDate: "desc" },
            },
          },
        },
        planSavings: {
          orderBy: { savingDate: "desc" },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({
      plans: plans.map((p) => {
        const totalSaved = p.planSavings.reduce((sum, saving) => sum + Number(saving.amount), 0);

        return {
          id: p.id,
          title: p.title,
          estimatedAmount: Number(p.estimatedAmount),
          dueDate: p.dueDate,
          priority: p.priority,
          status: p.status,
          note: p.note,
          linkedSavingsGoalId: p.linkedSavingsGoalId,
          linkedSavingsGoal: p.linkedSavingsGoal
            ? {
                id: p.linkedSavingsGoal.id,
                name: p.linkedSavingsGoal.name,
                targetAmount: Number(p.linkedSavingsGoal.targetAmount),
                currentAmount: Number(p.linkedSavingsGoal.currentAmount),
              }
            : null,
          savingsGoals: p.savingsGoals.map((goal) => ({
            id: goal.id,
            name: goal.name,
            targetAmount: Number(goal.targetAmount),
            currentAmount: Number(goal.currentAmount),
            progress: Number(goal.targetAmount) > 0 ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0,
            sourceType: goal.sourceType,
            entries: goal.entries.map((entry) => ({
              id: entry.id,
              amount: Number(entry.amount),
              entryDate: entry.entryDate,
              note: entry.note,
              memberId: entry.memberId,
            })),
          })),
          isInstallment: p.isInstallment,
          installmentMonths: p.installmentMonths,
          installmentAmount: p.installmentAmount ? Number(p.installmentAmount) : null,
          monthlySavingAmount: p.monthlySavingAmount ? Number(p.monthlySavingAmount) : null,
          totalSaved,
          remainingAmount: Math.max(0, Number(p.estimatedAmount) - totalSaved),
          savings: p.planSavings.map((saving) => ({
            id: saving.id,
            amount: Number(saving.amount),
            savingDate: saving.savingDate,
            note: saving.note,
            memberId: saving.memberId,
          })),
          daysUntilDue: Math.ceil((new Date(p.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
          createdAt: p.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/rencana error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const {
      title,
      estimatedAmount,
      dueDate,
      priority,
      status,
      note,
      linkedSavingsGoalId,
      isInstallment = false,
      installmentMonths = null,
      installmentAmount = null,
      monthlySavingAmount = null,
    } = body;

    if (!title || !estimatedAmount || estimatedAmount <= 0 || !dueDate) {
      return NextResponse.json({ error: "Judul, nominal, dan tanggal wajib diisi" }, { status: 400 });
    }

    const householdId = getHouseholdId();

    const plan = await prisma.financialPlan.create({
      data: {
        householdId,
        title,
        estimatedAmount,
        dueDate: new Date(dueDate),
        priority: priority || "MEDIUM",
        status: status || "PLANNED",
        note: note || null,
        linkedSavingsGoalId: linkedSavingsGoalId || null,
        isInstallment,
        installmentMonths,
        installmentAmount,
        monthlySavingAmount,
      },
      include: { linkedSavingsGoal: true },
    });

    return NextResponse.json({
      plan: {
        id: plan.id,
        title: plan.title,
        estimatedAmount: Number(plan.estimatedAmount),
        dueDate: plan.dueDate,
        priority: plan.priority,
        status: plan.status,
        note: plan.note,
        linkedSavingsGoalId: plan.linkedSavingsGoalId,
        linkedSavingsGoal: plan.linkedSavingsGoal
          ? {
              id: plan.linkedSavingsGoal.id,
              name: plan.linkedSavingsGoal.name,
              targetAmount: Number(plan.linkedSavingsGoal.targetAmount),
              currentAmount: Number(plan.linkedSavingsGoal.currentAmount),
            }
          : null,
        daysUntilDue: Math.ceil((new Date(plan.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        createdAt: plan.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/rencana error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}