import { Box, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { Campaign } from '@/types/Campaign';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { doc, getDoc } from '@firebase/firestore';
import db from '@/utils/firebase';

// TODO: Logic is repeated on CampaignId page
const CampaignTab = (props: { campaignId: string }) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaign = async () => {
      const campaignDocSnap = await getDoc(
        doc(db, 'campaigns', props.campaignId)
      );
      if (campaignDocSnap.exists()) {
        setCampaign(campaignDocSnap.data() as Campaign);
      } else {
        setCampaign(null);
      }
    };

    fetchCampaign().then(() => setLoading(false));
  }, [props.campaignId]);

  return (
    <>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {campaign && (
            <Link
              href={`campaigns/${props.campaignId}/collections/${campaign.baseCollectionId}`}
            >
              <Box sx={{ backgroundColor: 'grey' }}>
                <p>{campaign.title}</p>
              </Box>
            </Link>
          )}
        </>
      )}
    </>
  );
};

const CampaignList = () => {
  const { user } = useUser();
  const [campaignIds, setCampaignIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchCampaignIds = async (userId: string) => {
      const userDocSnap = await getDoc(doc(db, 'users', userId));
      if (userDocSnap.exists()) {
        setCampaignIds(userDocSnap.data().campaignIds);
      }
    };
    user && fetchCampaignIds(user.id);
  }, [user?.id]);

  return (
    <Box
      sx={{
        textAlign: 'center',
      }}
    >
      <h1>Your Campaigns</h1>
      {campaignIds.map((id) => (
        <CampaignTab campaignId={id} key={id} />
      ))}
    </Box>
  );
};
export default CampaignList;
