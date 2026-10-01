import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Admin public app sudah dipindahkan ke adminprashoes.prasapp.com." },
    { status: 410 }
  );
}
