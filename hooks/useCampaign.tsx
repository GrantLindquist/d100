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
import { doc, getDoc, onSnapshot } from '@firebase/firestore';
import db from '@/utils/firebase';
import { Campaign } from '@/types/Campaign';
import { Unit } from '@/types/Unit';

const CampaignContext = createContext<{
  campaign: Campaign | null;
  setCampaignId: Dispatch<SetStateAction<string | null>>;
  isUserDm: boolean | null;
  currentUnit: Unit | null;
  setCurrentUnitId: Dispatch<SetStateAction<string | null>>;
}>({
  campaign: null,
  setCampaignId: () => {},
  isUserDm: null,
  currentUnit: null,
  setCurrentUnitId: () => {},
});

export const CampaignProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [isUserDm, setIsUserDm] = useState<boolean | null>(null);

  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null);
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);

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
        setCurrentUnit(null);
      }
    };
    fetchCampaign();
  }, [campaignId, user?.id]);

  useEffect(() => {
    if (currentUnitId) {
      const unsubscribe = onSnapshot(
        doc(db, 'units', currentUnitId),
        (unitDocSnap) => {
          if (unitDocSnap.exists()) {
            setCurrentUnit(unitDocSnap.data() as Unit);
          } else {
            setCurrentUnit(null);
          }
        }
      );
      return () => {
        unsubscribe();
      };
    }
  }, [campaignId, currentUnitId]);

  return (
    <CampaignContext.Provider
      value={{
        campaign,
        setCampaignId,
        isUserDm,
        currentUnit,
        setCurrentUnitId,
      }}
    >
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
