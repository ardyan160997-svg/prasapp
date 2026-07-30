import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "prashoes_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

type AdminSession = {
  username: string;
  expiresAt: number;
};

function getAdminAuthConfig() {
  const usernames = (process.env.ADMIN_USERNAMES ?? process.env.ADMIN_USERNAME ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const password = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.ADMIN_AUTH_SECRET ?? "";

  return {
    usernames,
    password,
    secret,
  };
}

export function isAdminAuthConfigured() {
  const { usernames, password, secret } = getAdminAuthConfig();
  return Boolean(usernames.length > 0 && password && secret);
}

function isAllowedAdminUsername(username: string, allowedUsernames: string[]) {
  return allowedUsernames.some((allowedUsername) => safeEqual(username, allowedUsername));
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function createSessionSignature(username: string, expiresAt: number, secret: string) {
  return createHmac("sha256", secret)
    .update(`${username}:${expiresAt}`)
    .digest("hex");
}

export function createAdminSessionToken(username: string) {
  const { secret } = getAdminAuthConfig();
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000;
  const signature = createSessionSignature(username, expiresAt, secret);

  return `${username}.${expiresAt}.${signature}`;
}

export function verifyAdminCredentials(username: string, password: string) {
  const config = getAdminAuthConfig();

  if (config.usernames.length === 0 || !config.password || !config.secret) {
    return false;
  }

  const normalizedUsername = username.trim();

  return (
    isAllowedAdminUsername(normalizedUsername, config.usernames) &&
    safeEqual(password, config.password)
  );
}

export function getAdminSession(cookieStore: CookieReader): AdminSession | null {
  const { usernames, secret } = getAdminAuthConfig();

  if (usernames.length === 0 || !secret) {
    return null;
  }

  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return null;
  }

  const [sessionUsername, expiresAtRaw, signature] = sessionCookie.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (!sessionUsername || !signature || !Number.isFinite(expiresAt)) {
    return null;
  }

  if (!isAllowedAdminUsername(sessionUsername, usernames)) {
    return null;
  }

  if (Date.now() > expiresAt) {
    return null;
  }

  const expectedSignature = createSessionSignature(sessionUsername, expiresAt, secret);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  return {
    username: sessionUsername,
    expiresAt,
  };
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentAdminSession() {
  const cookieStore = await cookies();
  return getAdminSession(cookieStore);
}

export async function requireAdminRequest() {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: "Autentikasi admin belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const session = await getCurrentAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  return null;
}
