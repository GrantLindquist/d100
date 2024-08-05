'use client';

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useUser } from '@/hooks/useUser';
import { doc, getDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { Campaign } from '@/types/Campaign';

const CampaignContext = createContext<{
  campaign: Campaign | null;
  setCampaignId: Dispatch<SetStateAction<string | null>>;
  isUserDm: boolean | null;
}>({
  campaign: null,
  setCampaignId: () => {},
  isUserDm: null,
});

export const CampaignProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [isUserDm, setIsUserDm] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (campaignId && user) {
        const campaignDocSnap = await getDoc(doc(db, 'campaigns', campaignId));
        if (campaignDocSnap.exists()) {
          setCampaign(campaignDocSnap.data() as Campaign);
          setIsUserDm(user.id === campaignDocSnap.data().dmId);
        }
      } else {
        setCampaign(null);
        setIsUserDm(null);
      }
    };
    fetchCampaign();
  }, [campaignId, user?.id]);

  return (
    <CampaignContext.Provider value={{ campaign, setCampaignId, isUserDm }}>
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context)
    throw new Error('useCampaign must be used inside CampaignProvider');
  return context;
};
