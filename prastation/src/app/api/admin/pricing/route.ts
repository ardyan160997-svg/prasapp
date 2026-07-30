import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import { createPricingRule, listPricingRules } from "@/features/admin/services/master-data-repository";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }
  if (!requirePermission(session, "pricing:view")) {
    return NextResponse.json({ error: "Akses pricing ditolak." }, { status: 403 });
  }
  const searchParams = new URL(request.url).searchParams;
  return NextResponse.json(
    await listPricingRules({
      page: Number(searchParams.get("page") ?? "1"),
      pageSize: Number(searchParams.get("pageSize") ?? "10"),
    }),
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }
  if (!requirePermission(session, "pricing:manage")) {
    return NextResponse.json({ error: "Tidak punya izin kelola pricing." }, { status: 403 });
  }
  await createPricingRule(await request.json());
  return NextResponse.json(await listPricingRules());
}
