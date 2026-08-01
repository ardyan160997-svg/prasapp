import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import { createAdminUser, listAdminUsers } from "@/features/admin/services/admin-user-repository";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }
  if (!requirePermission(session, "admin_users:view")) {
    return NextResponse.json({ error: "Akses admin users ditolak." }, { status: 403 });
  }
  const searchParams = new URL(request.url).searchParams;
  return NextResponse.json(
    await listAdminUsers({
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
  if (!requirePermission(session, "admin_users:manage")) {
    return NextResponse.json({ error: "Tidak punya izin kelola admin users." }, { status: 403 });
  }

  try {
    await createAdminUser(await request.json());
    return NextResponse.json(await listAdminUsers());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat admin user." },
      { status: 400 },
    );
  }
}
