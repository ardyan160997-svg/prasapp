import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Admin photo API sudah dipindahkan ke adminprashoes.prasapp.com." },
    { status: 410 }
  );
}
