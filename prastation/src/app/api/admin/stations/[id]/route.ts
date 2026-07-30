import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import { deleteStation, listStations, updateStation } from "@/features/admin/services/master-data-repository";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }
  if (!requirePermission(session, "stations:manage")) {
    return NextResponse.json({ error: "Tidak punya izin kelola station." }, { status: 403 });
  }
  const { id } = await params;
  await updateStation(id, await request.json());
  return NextResponse.json(await listStations());
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }
  if (!requirePermission(session, "stations:manage")) {
    return NextResponse.json({ error: "Tidak punya izin kelola station." }, { status: 403 });
  }
  const { id } = await params;
  await deleteStation(id);
  return NextResponse.json(await listStations());
}
