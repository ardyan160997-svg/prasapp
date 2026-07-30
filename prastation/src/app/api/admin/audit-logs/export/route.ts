import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import { exportAuditLogsCsv } from "@/features/admin/services/master-data-repository";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }

  if (!requirePermission(session, "audit_logs:view")) {
    return NextResponse.json({ error: "Akses export audit log ditolak." }, { status: 403 });
  }

  const searchParams = new URL(request.url).searchParams;
  const csv = await exportAuditLogsCsv({
    actorUserId: searchParams.get("actorUserId") ?? undefined,
    action: searchParams.get("action") ?? undefined,
    entityType: searchParams.get("entityType") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="prastation-audit-logs.csv"',
    },
  });
}
