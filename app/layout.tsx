import type { Metadata } from 'next';
import AppWrapper from '@/components/AppWrapper';
import { ReactNode } from 'react';
import { NavbarContainer } from '@/components/Navbar';
import { CampaignProvider } from '@/hooks/useCampaign';
import { UserProvider } from '@/hooks/useUser';
import { AlertProvider } from '@/hooks/useAlert';
import { UnsavedChangesProvider } from '@/hooks/useUnsavedChanges';
import { SpotifyPlayerProvider } from '@/hooks/useSpotifyPlayer';
import { Box } from '@mui/material';
import { StickyNoteProvider } from '@/hooks/useStickyNotes';

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
        overscrollBehaviorX: 'none',
      }}
    >
    <AlertProvider>
      <UserProvider>
        <CampaignProvider>
          <SpotifyPlayerProvider>
            <UnsavedChangesProvider>
              <StickyNoteProvider>
                <AppWrapper>
                  <Box display="flex" flexDirection="column" minHeight="100vh">
                    <NavbarContainer />
                    <Box component="main" flex={1} overflow="auto" sx={{ overflow: 'hidden' }}>
                      {children}
                    </Box>
                  </Box>
                </AppWrapper>
              </StickyNoteProvider>
            </UnsavedChangesProvider>
          </SpotifyPlayerProvider>
        </CampaignProvider>
      </UserProvider>
    </AlertProvider>
    </body>
    </html>
  );
}
