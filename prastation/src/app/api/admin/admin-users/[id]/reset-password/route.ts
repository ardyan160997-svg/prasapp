import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import {
  listAdminUsers,
  resetAdminUserPassword,
} from "@/features/admin/services/admin-user-repository";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }
  if (!requirePermission(session, "admin_users:reset_password")) {
    return NextResponse.json({ error: "Tidak punya izin reset password." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as { password?: string } | null;

  if (!payload?.password || payload.password.length < 6) {
    return NextResponse.json(
      { error: "Password baru minimal 6 karakter." },
      { status: 400 },
    );
  }

  const { id } = await params;
  await resetAdminUserPassword(id, payload.password);
  return NextResponse.json(await listAdminUsers());
}
