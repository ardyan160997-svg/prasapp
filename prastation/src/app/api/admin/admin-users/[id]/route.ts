import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import {
  deleteAdminUser,
  getAdminUserById,
  listAdminUsers,
  updateAdminUser,
} from "@/features/admin/services/admin-user-repository";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }
  if (!requirePermission(session, "admin_users:manage")) {
    return NextResponse.json({ error: "Tidak punya izin kelola admin users." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const payload = await request.json();

    if (id === session.userId && payload?.isActive === false) {
      return NextResponse.json(
        { error: "Akun yang sedang dipakai tidak bisa dinonaktifkan sendiri." },
        { status: 400 },
      );
    }

    if (id === session.userId && payload?.role && payload.role !== session.role) {
      return NextResponse.json(
        { error: "Akun yang sedang dipakai tidak bisa mengubah role sendiri." },
        { status: 400 },
      );
    }

    await updateAdminUser(id, payload);
    return NextResponse.json(await listAdminUsers());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal memperbarui admin user." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }
  if (!requirePermission(session, "admin_users:manage")) {
    return NextResponse.json({ error: "Tidak punya izin kelola admin users." }, { status: 403 });
  }
  const { id } = await params;

  if (id === session.userId) {
    return NextResponse.json(
      { error: "Akun yang sedang dipakai tidak bisa dihapus sendiri." },
      { status: 400 },
    );
  }

  const target = await getAdminUserById(id);

  if (!target) {
    return NextResponse.json({ error: "Admin user tidak ditemukan." }, { status: 404 });
  }

  await deleteAdminUser(id);
  return NextResponse.json(await listAdminUsers());
}
