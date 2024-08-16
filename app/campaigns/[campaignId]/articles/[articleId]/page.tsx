'use client';
import { PageContent } from '@/components/content/PageContent';
import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useCampaign } from '@/hooks/useCampaign';

export default function ArticlePage() {
  const { user } = useUser();
  const { campaign } = useCampaign();
  const router = useRouter();
  useEffect(() => {
    if (campaign && user) {
      if (!user.campaignIds.includes(campaign.id)) {
        router.push('/campaigns/unauthorized');
      }
    }
  }, [user?.id, campaign?.id]);

  return <PageContent />;
}
