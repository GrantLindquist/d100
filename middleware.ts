import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/utils/userSession';

// Reroutes unauthenticated users
export async function middleware(request: NextRequest) {
  const result = await getUserFromSession();
  if (result?.user) {
    return NextResponse.next();
  } else {
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/campaigns/:path*'],
};
