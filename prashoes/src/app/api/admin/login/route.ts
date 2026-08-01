import { NextResponse } from "next/server";
import {
  createAdminSessionToken,
  isAdminAuthConfigured,
  setAdminSessionCookie,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: "Autentikasi admin belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const username = String(body?.username ?? "").trim();
  const password = String(body?.password ?? "");

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username dan password wajib diisi." },
      { status: 400 }
    );
  }

  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json(
      { error: "Username atau password salah." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });
  const token = createAdminSessionToken(username);

  setAdminSessionCookie(response, token);

  return response;
}
