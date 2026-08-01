import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import {
  getPermissionMatrix,
  updatePermissionMatrix,
} from "@/features/admin/services/admin-user-repository";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }

  if (!requirePermission(session, "admin_users:manage")) {
    return NextResponse.json({ error: "Tidak punya izin kelola permission matrix." }, { status: 403 });
  }

  const { id } = await params;
  return NextResponse.json(await getPermissionMatrix(id));
}

export async function PUT(request: Request, { params }: Params) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }

  if (!requirePermission(session, "admin_users:manage")) {
    return NextResponse.json({ error: "Tidak punya izin kelola permission matrix." }, { status: 403 });
  }

  const { id } = await params;
  const payload = (await request.json().catch(() => null)) as {
    entries?: Array<{
      branchId: string | null;
      permission: string;
      effect: "ALLOW" | "DENY" | "DEFAULT";
    }>;
  } | null;

  if (!payload?.entries) {
    return NextResponse.json({ error: "Entries permission matrix wajib diisi." }, { status: 400 });
  }

  await updatePermissionMatrix(id, payload.entries);
  return NextResponse.json(await getPermissionMatrix(id));
}
