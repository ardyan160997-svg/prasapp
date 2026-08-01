import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import { deleteMember, listMembers, updateMember } from "@/features/admin/services/master-data-repository";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }
  if (!requirePermission(session, "members:manage")) {
    return NextResponse.json({ error: "Tidak punya izin kelola member." }, { status: 403 });
  }
  const { id } = await params;
  await updateMember(id, await request.json());
  return NextResponse.json(await listMembers());
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }
  if (!requirePermission(session, "members:manage")) {
    return NextResponse.json({ error: "Tidak punya izin kelola member." }, { status: 403 });
  }
  const { id } = await params;
  await deleteMember(id);
  return NextResponse.json(await listMembers());
}
