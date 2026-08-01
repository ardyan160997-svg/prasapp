import { NextResponse } from "next/server";
import { createSession, authenticateAdmin } from "@/lib/admin-auth";

type LoginPayload = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as LoginPayload | null;
  const username = payload?.username?.trim();
  const password = payload?.password;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username dan password wajib diisi." },
      { status: 400 },
    );
  }

  if (!process.env.AUTH_SESSION_SECRET || !process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Konfigurasi autentikasi belum lengkap." },
      { status: 500 },
    );
  }

  const account = await authenticateAdmin(username, password);

  if (!account) {
    return NextResponse.json(
      { error: "Credential tidak valid." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    username: account.username,
    role: account.role,
    displayName: account.displayName,
  });

  await createSession(response, account);

  return response;
}
