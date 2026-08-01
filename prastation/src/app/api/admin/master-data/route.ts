import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import { getMasterDataSnapshot } from "@/features/admin/services/master-data-repository";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "10");

  const snapshot = await getMasterDataSnapshot({
    includeAdminUsers: requirePermission(session, "admin_users:view"),
    includeStations: requirePermission(session, "stations:view"),
    includeMembers: requirePermission(session, "members:view"),
    includePricingRules: requirePermission(session, "pricing:view"),
    includeAuditLogs: requirePermission(session, "audit_logs:view"),
    page,
    pageSize,
  });

  return NextResponse.json(snapshot);
}
