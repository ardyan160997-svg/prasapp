import { NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/admin-auth";
import { endBillingSession } from "@/features/billing/services/billing-repository";

type EndSessionPayload = {
  stationId?: string;
};

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Silakan login untuk mengakhiri sesi." },
      { status: 401 },
    );
  }

  if (!requirePermission(session, "billing:manage")) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk mengakhiri sesi." },
      { status: 403 },
    );
  }

  const payload = (await request.json().catch(() => null)) as EndSessionPayload | null;

  if (!payload?.stationId) {
    return NextResponse.json(
      { error: "Station wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const data = await endBillingSession({
      stationId: payload.stationId,
      actorUsername: session.username,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal mengakhiri sesi.",
      },
      { status: 400 },
    );
  }
}
