import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "prastation",
    timestamp: new Date().toISOString(),
  });
}
