import type { Metadata } from 'next';
import AppWrapper from '@/components/AppWrapper';
import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import { CampaignProvider } from '@/hooks/useCampaign';
import { UserProvider } from '@/hooks/useUser';
import { AlertProvider } from '@/hooks/useAlert';

export const metadata: Metadata = {
  title: 'd100',
  description: 'D&D Threads',
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
              <AppWrapper>
                <Navbar />
                {children}
              </AppWrapper>
            </CampaignProvider>
          </UserProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
