import { NextRequest, NextResponse } from 'next/server';

const ROLE_PREFIX: Record<string, string> = {
  STUDENT: '/student',
  FACULTY: '/faculty',
  ASSISTANT: '/assistant',
  ADMIN: '/admin',
};

const ROLE_HOME: Record<string, string> = {
  STUDENT: '/student/dashboard',
  FACULTY: '/faculty/dashboard',
  ASSISTANT: '/assistant/dashboard',
  ADMIN: '/admin/dashboard',
};

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/forgot-password',
  '/contact',
  '/team',
  '/how-it-works',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return true;
  }
  return false;
}

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith('/student') ||
    pathname.startsWith('/faculty') ||
    pathname.startsWith('/assistant') ||
    pathname.startsWith('/admin')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths and assets
  if (isPublicPath(pathname) && pathname !== '/login') {
    return NextResponse.next();
  }

  const isAuthenticated = request.cookies.get('kriterion_auth')?.value === '1';
  const role = (request.cookies.get('kriterion_role')?.value ?? '').trim();

  // Authenticated user hitting /login → redirect to their dashboard
  if (pathname === '/login' && isAuthenticated && role) {
    const home = ROLE_HOME[role];
    if (home) {
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  // Not a protected route → allow
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // Unauthenticated user hitting a protected route → login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated - enforce role boundaries
  const allowedPrefix = ROLE_PREFIX[role];
  if (!allowedPrefix || !pathname.startsWith(allowedPrefix)) {
    const home = ROLE_HOME[role] ?? '/login';
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
