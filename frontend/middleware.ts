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
  ADMIN: '/admin/users',
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

function getRole(rawRole: string | undefined): string {
  return (rawRole ?? '').trim().toUpperCase();
}

function buildRedirect(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Always allow public paths and assets
    if (isPublicPath(pathname) && pathname !== '/login') {
      return NextResponse.next();
    }

    const isAuthenticated = request.cookies.get('kriterion_auth')?.value === '1';
    const role = getRole(request.cookies.get('kriterion_role')?.value);

    // Authenticated user hitting /login → redirect to their dashboard
    if (pathname === '/login' && isAuthenticated && role) {
      const home = ROLE_HOME[role];
      if (home) {
        return buildRedirect(request, home);
      }
    }

    // Not a protected route → allow
    if (!isProtectedPath(pathname)) {
      return NextResponse.next();
    }

    // Unauthenticated user hitting a protected route → login
    if (!isAuthenticated) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated - enforce role boundaries
    const allowedPrefix = ROLE_PREFIX[role];
    if (!allowedPrefix || !pathname.startsWith(allowedPrefix)) {
      const home = ROLE_HOME[role] ?? '/login';
      return buildRedirect(request, home);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('middleware_error', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
