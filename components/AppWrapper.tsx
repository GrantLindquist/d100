'use client';

import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';
import { getCampaignIdFromUrl } from '@/utils/url';
import { Outfit } from 'next/font/google';
import { doc, updateDoc } from '@firebase/firestore';
import { useUser } from '@/hooks/useUser';
import db from '@/utils/firebase';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

export const outfit = Outfit({ subsets: ['latin'] });

const AppWrapper = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isUnsavedChanges, setUnsavedChanges } = useUnsavedChanges();
  const { user } = useUser();
  const { campaign, setCampaignId } = useCampaign();
  const url = pathname.split('/').slice(1);

  useEffect(() => {
    isUnsavedChanges && setUnsavedChanges(false);

    // Organizes campaignIds by last opened
    const organizeCampaignIds = async () => {
      if (campaign?.id && user) {
        const campaignIds = [
          campaign.id,
          ...user.campaignIds.filter((c) => c !== campaign.id),
        ];
        await updateDoc(doc(db, 'users', user.id), {
          campaignIds: campaignIds,
        });
      }
    };

    // Set current campaign
    const urlCampaignId = getCampaignIdFromUrl(url);
    if (urlCampaignId && user) {
      if (user.campaignIds.includes(urlCampaignId)) {
        if (urlCampaignId !== campaign?.id) {
          setCampaignId(urlCampaignId);
          organizeCampaignIds();
        }
      }
      // Redirects unauthorized requests
      else {
        router.push('/campaigns/unauthorized');
      }
    } else {
      setCampaignId(null);
    }
  }, [pathname, user]);

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#ff6a48',
      },
      secondary: {
        main: '#FF956F',
      },
      background: {
        default: '#010101',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            // Scrollbar styles
            scrollbarColor: '#666666 rgba(0, 0, 0, 0)', // thumb and track colors

            '&::-webkit-scrollbar': {
              width: '8px', // Width of the scrollbar
              height: '8px', // Height of the scrollbar (for horizontal scroll)
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#666666', // Thumb color
              borderRadius: '8px', // Round the thumb edges
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0, 0, 0, 0)', // Track color
            },
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
export default AppWrapper;
