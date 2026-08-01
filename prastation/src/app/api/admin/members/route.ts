import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import { createMember, listMembers } from "@/features/admin/services/master-data-repository";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }
  if (!requirePermission(session, "members:view")) {
    return NextResponse.json({ error: "Akses member ditolak." }, { status: 403 });
  }
  const searchParams = new URL(request.url).searchParams;
  return NextResponse.json(
    await listMembers({
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
  if (!requirePermission(session, "members:manage")) {
    return NextResponse.json({ error: "Tidak punya izin kelola member." }, { status: 403 });
  }
  await createMember(await request.json());
  return NextResponse.json(await listMembers());
}
