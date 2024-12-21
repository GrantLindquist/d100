'use client';
import { PageContent } from '@/components/content/PageContent';
import { useUser } from '@/hooks/useUser';
import { useCampaign } from '@/hooks/useCampaign';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function QuestPage() {
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
