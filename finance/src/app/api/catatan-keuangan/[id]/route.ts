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

    const transaction = await prisma.transaction.findFirst({
      where: { id, householdId, isDeleted: false },
      include: { category: true, member: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("GET /api/catatan-keuangan/[id] error:", error);
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
    const { type, categoryId, amount, transactionDate, note, expenseMode, paymentMethod, memberId } = body;

    const householdId = getHouseholdId();

    const existing = await prisma.transaction.findFirst({
      where: { id, householdId, isDeleted: false },
    });

    if (!existing) {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    if (type && !["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json({ error: "Tipe harus INCOME atau EXPENSE" }, { status: 400 });
    }

    if (amount !== undefined && amount <= 0) {
      return NextResponse.json({ error: "Nominal harus lebih dari 0" }, { status: 400 });
    }

    if (type === "EXPENSE" && expenseMode && !["NEEDS", "WANTS"].includes(expenseMode)) {
      return NextResponse.json({ error: "Mode pengeluaran tidak valid" }, { status: 400 });
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        type: type || undefined,
        categoryId: categoryId || undefined,
        amount: amount || undefined,
        transactionDate: transactionDate ? new Date(transactionDate) : undefined,
        note: note !== undefined ? note : undefined,
        expenseMode: expenseMode || (type === "INCOME" ? null : undefined),
        paymentMethod: paymentMethod !== undefined ? paymentMethod : undefined,
        memberId: memberId || undefined,
      },
      include: { category: true, member: true },
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("PUT /api/catatan-keuangan/[id] error:", error);
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

    const existing = await prisma.transaction.findFirst({
      where: { id, householdId, isDeleted: false },
    });

    if (!existing) {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    await prisma.transaction.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/catatan-keuangan/[id] error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}