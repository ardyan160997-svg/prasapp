import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getRolePermissions } from "@/lib/auth-config";
import { authenticateAdminUser } from "@/features/admin/services/admin-user-repository";
import type {
  AdminPermission,
  AdminRole,
  AdminSession,
} from "@/types/auth";

const SESSION_COOKIE_NAME = "prastation_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12;

function sign(payload: string) {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured.");
  }

  return createHmac("sha256", secret).update(payload).digest("hex");
}

function encodeSession(session: AdminSession) {
  const payload = JSON.stringify(session);
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`, "utf8").toString("base64url");
}

function decodeSession(token: string) {
  const raw = Buffer.from(token, "base64url").toString("utf8");
  const separatorIndex = raw.lastIndexOf(".");

  if (separatorIndex <= 0) {
    return null;
  }

  const payload = raw.slice(0, separatorIndex);
  const signature = raw.slice(separatorIndex + 1);
  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const parsed = JSON.parse(payload) as AdminSession;
  const expiresAt = new Date(parsed.expiresAt).getTime();

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  return parsed;
}

export async function authenticateAdmin(username: string, password: string) {
  return authenticateAdminUser(username, password);
}

export function hasPermission(
  session: AdminSession | null,
  permission: AdminPermission,
) {
  return session?.permissions.includes(permission) ?? false;
}

export function requirePermission(
  session: AdminSession | null,
  permission: AdminPermission,
) {
  return hasPermission(session, permission);
}

export async function createSession(
  response: NextResponse,
  account: {
    userId: string;
    branchId: string | null;
    username: string;
    role: AdminRole;
    displayName: string;
  },
) {
  const session: AdminSession = {
    username: account.username,
    role: account.role,
    displayName: account.displayName,
    userId: account.userId,
    branchId: account.branchId,
    permissions: [...getRolePermissions(account.role)],
    expiresAt: new Date(
      Date.now() + SESSION_DURATION_SECONDS * 1000,
    ).toISOString(),
  };

  response.cookies.set(SESSION_COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return decodeSession(token);
}
