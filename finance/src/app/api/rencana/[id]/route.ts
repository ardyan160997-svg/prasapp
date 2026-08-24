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

    const plan = await prisma.financialPlan.findFirst({
      where: { id, householdId },
      include: { linkedSavingsGoal: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Rencana tidak ditemukan" }, { status: 404 });
    }

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
    });
  } catch (error) {
    console.error("GET /api/rencana/[id] error:", error);
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
    const {
      title,
      estimatedAmount,
      dueDate,
      priority,
      status,
      note,
      linkedSavingsGoalId,
      isInstallment,
      installmentMonths,
      installmentAmount,
      monthlySavingAmount,
    } = body;
    const householdId = getHouseholdId();

    const plan = await prisma.financialPlan.findFirst({
      where: { id, householdId },
    });

    if (!plan) {
      return NextResponse.json({ error: "Rencana tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.financialPlan.update({
      where: { id },
      data: {
        title: title ?? plan.title,
        estimatedAmount: estimatedAmount ?? plan.estimatedAmount,
        dueDate: dueDate ? new Date(dueDate) : plan.dueDate,
        priority: priority ?? plan.priority,
        status: status ?? plan.status,
        note: note ?? plan.note,
        linkedSavingsGoalId: linkedSavingsGoalId === undefined ? plan.linkedSavingsGoalId : linkedSavingsGoalId || null,
        isInstallment: isInstallment ?? plan.isInstallment,
        installmentMonths: installmentMonths === undefined ? plan.installmentMonths : installmentMonths,
        installmentAmount: installmentAmount === undefined ? plan.installmentAmount : installmentAmount,
        monthlySavingAmount: monthlySavingAmount === undefined ? plan.monthlySavingAmount : monthlySavingAmount,
      },
      include: { linkedSavingsGoal: true },
    });

    return NextResponse.json({
      plan: {
        id: updated.id,
        title: updated.title,
        estimatedAmount: Number(updated.estimatedAmount),
        dueDate: updated.dueDate,
        priority: updated.priority,
        status: updated.status,
        note: updated.note,
        linkedSavingsGoalId: updated.linkedSavingsGoalId,
        linkedSavingsGoal: updated.linkedSavingsGoal
          ? {
              id: updated.linkedSavingsGoal.id,
              name: updated.linkedSavingsGoal.name,
              targetAmount: Number(updated.linkedSavingsGoal.targetAmount),
              currentAmount: Number(updated.linkedSavingsGoal.currentAmount),
            }
          : null,
        daysUntilDue: Math.ceil((new Date(updated.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    console.error("PUT /api/rencana/[id] error:", error);
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

    const plan = await prisma.financialPlan.findFirst({
      where: { id, householdId },
    });

    if (!plan) {
      return NextResponse.json({ error: "Rencana tidak ditemukan" }, { status: 404 });
    }

    await prisma.financialPlan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/rencana/[id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}