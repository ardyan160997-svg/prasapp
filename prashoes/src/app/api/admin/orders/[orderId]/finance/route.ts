import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    { error: "Admin finance API sudah dipindahkan ke adminprashoes.prasapp.com." },
    { status: 410 }
  );
}
