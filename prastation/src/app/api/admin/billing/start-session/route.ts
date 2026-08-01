import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import { startBillingSession } from "@/features/billing/services/billing-repository";

type StartSessionPayload = {
  stationId?: string;
  memberId?: string | null;
  memberName?: string | null;
  durationMinutes?: number;
};

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Silakan login untuk memulai sesi." },
      { status: 401 },
    );
  }

  if (!requirePermission(session, "billing:manage")) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk memulai sesi." },
      { status: 403 },
    );
  }

  const payload = (await request.json().catch(() => null)) as StartSessionPayload | null;

  if (!payload?.stationId || !payload.durationMinutes || payload.durationMinutes <= 0) {
    return NextResponse.json(
      { error: "Station dan durasi wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const data = await startBillingSession({
      stationId: payload.stationId,
      memberId: payload.memberId ?? null,
      memberName: payload.memberName ?? null,
      durationMinutes: payload.durationMinutes,
      actorUsername: session.username,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal memulai sesi.",
      },
      { status: 400 },
    );
  }
}
