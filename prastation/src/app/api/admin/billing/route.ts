import { NextResponse } from "next/server";
import { getBillingDashboardData } from "@/features/billing/services/billing-repository";
import { getSession, requirePermission } from "@/lib/admin-auth";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Silakan login untuk membuka dashboard billing." },
      { status: 401 },
    );
  }

  if (!requirePermission(session, "billing:view")) {
    return NextResponse.json(
      { error: "Anda tidak memiliki akses ke dashboard billing." },
      { status: 403 },
    );
  }

  try {
    return NextResponse.json(await getBillingDashboardData());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal memuat dashboard billing dari database.",
      },
      { status: 500 },
    );
  }
}
