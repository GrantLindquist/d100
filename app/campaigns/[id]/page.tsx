'use client';

import { useEffect, useState } from 'react';
import { Campaign } from '@/types/Campaign';
import { doc, getDoc } from '@firebase/firestore';
import db from '@/utils/firebase';

export default function CampaignPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      const campaignDocSnap = await getDoc(doc(db, 'campaigns', params.id));
      if (campaignDocSnap.exists()) {
        setCampaign(campaignDocSnap.data() as Campaign);
      } else {
        setCampaign(null);
      }
    };

    fetchCampaign();
  }, [params.id]);

  // TODO: Figure out best way to handle page loading state, maybe skeleton?
  return <>{campaign ? <h1>Search through {campaign.title}</h1> : <></>}</>;
}
