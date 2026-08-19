import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EDITOR_PASSWORD = process.env.EDITOR_PASSWORD || 'novia2024';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /editor routes (except login)
  if (pathname.startsWith('/editor') && !pathname.startsWith('/editor/login')) {
    const authCookie = request.cookies.get('editor_auth');

    if (authCookie?.value !== 'true') {
      const loginUrl = new URL('/editor/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If accessing login page while already authenticated, redirect to editor
  if (pathname === '/editor/login') {
    const authCookie = request.cookies.get('editor_auth');
    if (authCookie?.value === 'true') {
      return NextResponse.redirect(new URL('/editor', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/editor/:path*'],
};