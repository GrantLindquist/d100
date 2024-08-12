import { Box, Card, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Campaign } from '@/types/Campaign';
import { useUser } from '@/hooks/useUser';
import { doc, onSnapshot } from '@firebase/firestore';
import db from '@/utils/firebase';
import { useRouter } from 'next/navigation';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import PlayerAvatarList from '@/components/PlayerAvatarList';

// TODO: Tweak component to use user.campaignIds instead of subscribe - also figure out user session vs functional? Maybe make them the same?
const CampaignTab = (props: { campaignId: string }) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'campaigns', props.campaignId),
      (campaignDocSnap) => {
        if (campaignDocSnap.exists()) {
          setCampaign(campaignDocSnap.data() as Campaign);
        } else {
          setCampaign(null);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [props.campaignId]);

  return (
    <div
      onClick={() =>
        campaign &&
        router.push(
          `campaigns/${props.campaignId}/collections/${campaign.baseCollectionId}`
        )
      }
    >
      <Card
        variant="outlined"
        sx={{
          cursor: 'pointer',
          ':hover': {
            backgroundColor: 'rgba(255,255,255, .05)',
          },
        }}
      >
        <Box py={1.5} px={2.5}>
          {loading ? (
            <Stack spacing={1} py={1}>
              <Skeleton variant="rounded" width={'80%'} height={20} />
              <Skeleton variant="rounded" width={'55%'} height={20} />
            </Stack>
          ) : (
            <>
              {campaign && (
                <>
                  <Typography variant={'h6'} fontWeight={BOLD_FONT_WEIGHT}>
                    {campaign.title}
                  </Typography>
                  <Stack direction={'row'} spacing={2}>
                    <PlayerAvatarList playerIds={campaign.playerIds} />
                  </Stack>
                </>
              )}
            </>
          )}
        </Box>
      </Card>
    </div>
  );
};

const CampaignList = () => {
  const { user } = useUser();
  const [campaignIds, setCampaignIds] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(
        doc(db, 'users', user.id),
        (userDocSnap) => {
          if (userDocSnap.exists()) {
            setCampaignIds(userDocSnap.data().campaignIds);
          }
        }
      );
      return () => {
        unsubscribe();
      };
    }
  }, [user?.id]);

  return (
    <>
      <Typography align={'center'} variant={'h3'}>
        Your Campaigns
      </Typography>

      <Grid container spacing={2}>
        {campaignIds.map((id) => (
          <Grid item md={campaignIds.length <= 1 ? 12 : 6} xs={12} key={id}>
            <CampaignTab campaignId={id} />
          </Grid>
        ))}
      </Grid>
    </>
  );
};
export default CampaignList;
