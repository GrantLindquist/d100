import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getCookie } from '@/utils/cookie';

// Reroutes unauthenticated users
// TODO: Create middleware that refreshes spotify token if expired after 1 hour
export async function middleware(request: NextRequest) {
  const result = await getCookie('session');
  if (result?.obj) {
    return NextResponse.next();
  } else {
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/campaigns/:path*'],
};
