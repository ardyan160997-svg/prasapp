import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import { extendBillingSession } from "@/features/billing/services/billing-repository";

type ExtendSessionPayload = {
  stationId?: string;
  durationMinutes?: number;
};

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Silakan login untuk menambah waktu." },
      { status: 401 },
    );
  }

  if (!requirePermission(session, "billing:manage")) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk menambah waktu." },
      { status: 403 },
    );
  }

  const payload = (await request.json().catch(() => null)) as ExtendSessionPayload | null;

  if (!payload?.stationId || !payload.durationMinutes || payload.durationMinutes <= 0) {
    return NextResponse.json(
      { error: "Station dan durasi tambahan wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const data = await extendBillingSession({
      stationId: payload.stationId,
      durationMinutes: payload.durationMinutes,
      actorUsername: session.username,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal menambah waktu.",
      },
      { status: 400 },
    );
  }
}
