import type { Metadata } from 'next';
import AppWrapper from '@/components/AppWrapper';
import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import { CampaignProvider } from '@/hooks/useCampaign';
import { UserProvider } from '@/hooks/useUser';
import { AlertProvider } from '@/hooks/useAlert';
import { UnsavedChangesProvider } from '@/hooks/useUnsavedChanges';
import { SpotifyPlayerProvider } from '@/hooks/useSpotifyPlayer';

export const metadata: Metadata = {
  title: 'd100',
  description:
    'Web app for D&D players to organize campaign information effectively into a “wiki-style” repository.',
  icons: {
    icon: '/d100-favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          overscrollBehavior: 'none',
        }}
      >
        <AlertProvider>
          <UserProvider>
            <CampaignProvider>
              <SpotifyPlayerProvider>
                <UnsavedChangesProvider>
                  <AppWrapper>
                    <Navbar />
                    {children}
                  </AppWrapper>
                </UnsavedChangesProvider>
              </SpotifyPlayerProvider>
            </CampaignProvider>
          </UserProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
