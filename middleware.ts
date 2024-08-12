import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/utils/userSession';
import { getCampaignIdFromUrl } from '@/utils/url';

// Reroutes unauthenticated users
export async function middleware(request: NextRequest) {
  const result = await getUserFromSession();

  if (result?.user) {
    const campaignId = getCampaignIdFromUrl(request.url.split('/').slice(1));
    if (!campaignId || result.user.campaignIds.includes(campaignId)) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(
        new URL('/campaigns/unauthorized', request.url)
      );
    }
  } else {
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/campaigns((?!/unauthorized).*)'],
};
