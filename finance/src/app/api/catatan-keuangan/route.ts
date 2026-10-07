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
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const memberId = searchParams.get("memberId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const householdId = getHouseholdId();

    const where: Record<string, unknown> = {
      householdId,
      isDeleted: false,
    };

    if (type && (type === "INCOME" || type === "EXPENSE")) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (memberId) {
      where.memberId = memberId;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) (where.transactionDate as Record<string, string>).gte = new Date(startDate).toISOString();
      if (endDate) (where.transactionDate as Record<string, string>).lte = new Date(endDate).toISOString();
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          member: true,
        },
        orderBy: { transactionDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/catatan-keuangan error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { type, categoryId, amount, transactionDate, note, expenseMode, paymentMethod, memberId } = body;

    if (!type || !["INCOME", "EXPENSE"].includes(type)) {
      return NextResponse.json({ error: "Tipe harus INCOME atau EXPENSE" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Kategori wajib diisi" }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Nominal harus lebih dari 0" }, { status: 400 });
    }

    if (!transactionDate) {
      return NextResponse.json({ error: "Tanggal wajib diisi" }, { status: 400 });
    }

    if (!memberId) {
      return NextResponse.json({ error: "Member wajib diisi" }, { status: 400 });
    }

    if (type === "EXPENSE" && !expenseMode) {
      return NextResponse.json({ error: "Mode pengeluaran (Kebutuhan/Keinginan) wajib diisi" }, { status: 400 });
    }

    const householdId = getHouseholdId();

    const transaction = await prisma.transaction.create({
      data: {
        householdId,
        type,
        categoryId,
        amount,
        transactionDate: new Date(transactionDate),
        note: note || null,
        expenseMode: type === "EXPENSE" ? expenseMode : null,
        paymentMethod: paymentMethod || null,
        memberId,
      },
      include: {
        category: true,
        member: true,
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("POST /api/catatan-keuangan error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}