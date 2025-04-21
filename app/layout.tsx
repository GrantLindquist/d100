import type { Metadata } from 'next';
import AppWrapper from '@/components/AppWrapper';
import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import { CampaignProvider } from '@/hooks/useCampaign';
import { UserProvider } from '@/hooks/useUser';
import { AlertProvider } from '@/hooks/useAlert';
import { UnsavedChangesProvider } from '@/hooks/useUnsavedChanges';
import { SpotifyPlayerProvider } from '@/hooks/useSpotifyPlayer';
import { Box } from '@mui/material';

/* TODO: UI Overhaul
* 1. Update Typography in Theme to automatically set styles
* 2. Change background to one consistent color instead of between black and grey
* 3. Use paper instead of background color
* 4. Prevent scrollbar from shifting content
* 5. Replace Masonry
* 6. Make components more attractive
* 7. Animations?
* */

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
              <AppWrapper>
                <Box display="flex" flexDirection="column" minHeight="100vh">
                  <Navbar />
                  <Box component="main" flex={1} overflow="auto" sx={{ overflow: 'hidden' }}>
                    {children}
                  </Box>
                </Box>
                <Navbar />
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
