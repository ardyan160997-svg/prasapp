import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import { listAuditLogs } from "@/features/admin/services/master-data-repository";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }
  if (!requirePermission(session, "audit_logs:view")) {
    return NextResponse.json({ error: "Akses audit log ditolak." }, { status: 403 });
  }
  const searchParams = new URL(request.url).searchParams;

  return NextResponse.json(
    await listAuditLogs({
      page: Number(searchParams.get("page") ?? "1"),
      pageSize: Number(searchParams.get("pageSize") ?? "10"),
      actorUserId: searchParams.get("actorUserId") ?? undefined,
      action: searchParams.get("action") ?? undefined,
      entityType: searchParams.get("entityType") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
    }),
  );
}
