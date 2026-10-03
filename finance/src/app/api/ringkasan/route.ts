import { prisma } from "@/lib/prisma";
import { verifyHouseholdAuth } from "@/lib/auth";

function getHouseholdId() {
  return "default-household";
}

async function checkAuth() {
  const authenticated = await verifyHouseholdAuth();
  if (!authenticated) {
    return { error: "Unauthorized", status: 401 };
  }
  return null;
}

export async function GET(request: Request) {
  const authError = await checkAuth();
  if (authError) return Response.json({ error: authError.error }, { status: authError.status });

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const householdId = getHouseholdId();

    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const [transactions, categories, savingsGoals, plans, members] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          householdId,
          isDeleted: false,
          transactionDate: { gte: startOfMonth, lte: endOfMonth },
        },
        include: { category: true, member: true },
        orderBy: { transactionDate: "desc" },
      }),
      prisma.category.findMany({
        where: { householdId, isActive: true },
        orderBy: { type: "asc" },
      }),
      prisma.savingsGoal.findMany({
        where: { householdId, status: "ACTIVE" },
        include: { entries: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.financialPlan.findMany({
        where: { householdId, status: { in: ["PLANNED", "IN_PROGRESS"] } },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.member.findMany({
        where: { householdId, isActive: true },
      }),
    ]);

    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const needs = transactions
      .filter((t) => t.type === "EXPENSE" && t.expenseMode === "NEEDS")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const wants = transactions
      .filter((t) => t.type === "EXPENSE" && t.expenseMode === "WANTS")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseByCategory = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce(
        (acc, t) => {
          const key = t.category.name;
          acc[key] = (acc[key] || 0) + Number(t.amount);
          return acc;
        },
        {} as Record<string, number>
      );

    const incomeByCategory = transactions
      .filter((t) => t.type === "INCOME")
      .reduce(
        (acc, t) => {
          const key = t.category.name;
          acc[key] = (acc[key] || 0) + Number(t.amount);
          return acc;
        },
        {} as Record<string, number>
      );

    const expenseByMember = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce(
        (acc, t) => {
          const key = t.member.name;
          acc[key] = (acc[key] || 0) + Number(t.amount);
          return acc;
        },
        {} as Record<string, number>
      );

    const totalSavings = savingsGoals.reduce((sum, g) => sum + Number(g.currentAmount), 0);

    return Response.json({
      period: { month: targetMonth, year: targetYear },
      summary: {
        income,
        expense,
        netFlow: income - expense,
        needs,
        wants,
        totalSavings,
        transactionCount: transactions.length,
      },
      breakdown: {
        expenseByCategory,
        incomeByCategory,
        expenseByMember,
      },
      savingsGoals: savingsGoals.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        targetDate: g.targetDate,
        status: g.status,
        progress: Number(g.targetAmount) > 0 ? (Number(g.currentAmount) / Number(g.targetAmount)) * 100 : 0,
      })),
      upcomingPlans: plans.map((p) => ({
        id: p.id,
        title: p.title,
        estimatedAmount: Number(p.estimatedAmount),
        dueDate: p.dueDate,
        priority: p.priority,
        status: p.status,
        daysUntilDue: Math.ceil((new Date(p.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      members,
      categories,
    });
  } catch (error) {
    console.error("GET /api/ringkasan error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}