import { NextResponse } from 'next/server';

/**
 * Lightweight middleware — Edge-compatible
 * Only checks if the auth session cookie exists (not its validity).
 * Actual auth verification happens in API routes and server components via NextAuth.
 * This avoids importing db.js/auth.js into Edge Runtime.
 */
export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Public routes — always allow
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/company') ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (NextAuth uses this cookie name)
  const sessionCookie =
    req.cookies.get('authjs.session-token') ||
    req.cookies.get('__Secure-authjs.session-token') ||
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token');

  if (!sessionCookie) {
    // Not logged in — redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Note: Admin-only route protection is handled at the API/page level,
  // not here, since we can't decode the JWT without importing auth.js
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.png$|.*\\.svg$).*)',
  ],
};
