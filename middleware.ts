import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  const isAuthenticated = !!session;
  const isAtRoot = request.nextUrl.pathname === '/';

  if (!isAuthenticated && !isAtRoot) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isAuthenticated && isAtRoot) {
    return NextResponse.redirect(new URL('/campaigns', request.url));
  }

  // Otherwise allow the request
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/campaigns/:path*'],
};
