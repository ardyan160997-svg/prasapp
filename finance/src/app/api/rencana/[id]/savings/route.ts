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

    const savings = await prisma.planSaving.findMany({
      where: { planId: id, householdId },
      orderBy: { savingDate: "desc" },
    });

    const totalSaved = savings.reduce((sum, s) => sum + Number(s.amount), 0);

    return NextResponse.json({
      savings: savings.map((s) => ({
        id: s.id,
        amount: Number(s.amount),
        savingDate: s.savingDate,
        note: s.note,
        memberId: s.memberId,
      })),
      totalSaved,
    });
  } catch (error) {
    console.error("GET /api/rencana/[id]/savings error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
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
    const { amount, savingDate, note, memberId } = body;

    if (!amount || amount <= 0 || !memberId || !savingDate) {
      return NextResponse.json({ error: "Nominal, tanggal, dan member wajib diisi" }, { status: 400 });
    }

    const householdId = getHouseholdId();

    const plan = await prisma.financialPlan.findFirst({
      where: { id, householdId },
    });

    if (!plan) {
      return NextResponse.json({ error: "Rencana tidak ditemukan" }, { status: 404 });
    }

    const [saving] = await prisma.$transaction(async (tx) => {
      const created = await tx.planSaving.create({
        data: {
          householdId,
          planId: id,
          memberId,
          amount,
          savingDate: new Date(savingDate),
          note: note || null,
        },
      });

      return [created];
    });

    return NextResponse.json({
      saving: {
        id: saving.id,
        amount: Number(saving.amount),
        savingDate: saving.savingDate,
        note: saving.note,
        memberId: saving.memberId,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/rencana/[id]/savings error:", error);
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
    const savingId = searchParams.get("savingId");
    const { id } = await params;

    if (!savingId) {
      return NextResponse.json({ error: "savingId wajib diisi" }, { status: 400 });
    }

    const householdId = getHouseholdId();

    const saving = await prisma.planSaving.findFirst({
      where: { id: savingId, planId: id, householdId },
    });

    if (!saving) {
      return NextResponse.json({ error: "Tabungan tidak ditemukan" }, { status: 404 });
    }

    await prisma.planSaving.delete({ where: { id: savingId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/rencana/[id]/savings error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}