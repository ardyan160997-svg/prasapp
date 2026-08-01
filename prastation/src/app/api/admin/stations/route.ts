import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import { createStation, listStations } from "@/features/admin/services/master-data-repository";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  }
  if (!requirePermission(session, "stations:view")) {
    return NextResponse.json({ error: "Akses station ditolak." }, { status: 403 });
  }
  const searchParams = new URL(request.url).searchParams;
  return NextResponse.json(
    await listStations({
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
  if (!requirePermission(session, "stations:manage")) {
    return NextResponse.json({ error: "Tidak punya izin kelola station." }, { status: 403 });
  }

  const payload = await request.json();
  await createStation(payload);
  return NextResponse.json(await listStations());
}
