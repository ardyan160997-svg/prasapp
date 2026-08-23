import { NextRequest, NextResponse } from "next/server";
import { loginAction, logoutAction } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { action, password } = await request.json();

    if (action === "login") {
      if (!password) {
        return NextResponse.json({ success: false, error: "Password diperlukan" }, { status: 400 });
      }
      const result = await loginAction(password);
      return NextResponse.json(result, { status: result.success ? 200 : 401 });
    }

    if (action === "logout") {
      await logoutAction();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}