'use client';
import {
  Box,
  Card,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { memo, useEffect, useState } from 'react';
import { Campaign } from '@/types/Campaign';
import { useUser } from '@/hooks/useUser';
import { doc, onSnapshot } from '@firebase/firestore';
import db from '@/utils/firebase';
import { useRouter } from 'next/navigation';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import PlayerAvatarList from '@/components/PlayerAvatarList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CampaignActionsModal from '@/components/modals/CampaignActionsModal';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const CampaignTab = (props: {
  campaignId: string;
  displayActions: boolean;
}) => {
  const router = useRouter();
  const { user } = useUser();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<'edit' | 'delete' | null>(null);

  const [anchor, setAnchor] = useState(null);

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

  const handleClick = (event: any) => {
    event.stopPropagation();
    setAnchor(event.currentTarget);
  };

  if (!loading && !campaign) {
    return null;
  }

  return (
    <div
      onClick={() =>
        campaign &&
        !anchor &&
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
            backgroundColor: 'rgba(28, 28, 28)',
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
                <Stack direction={'row'}>
                  <Box flexGrow={1}>
                    <Typography variant={'h6'} fontWeight={BOLD_FONT_WEIGHT}>
                      {campaign.title}
                    </Typography>
                    <PlayerAvatarList players={campaign.players} />
                  </Box>
                  {(props.displayActions || anchor) && (
                    <IconButton
                      onClick={handleClick}
                      disableRipple
                      disableFocusRipple
                      sx={{
                        paddingRight: 0,
                        width: '10%',
                      }}
                    >
                      <MoreVertIcon
                        sx={{
                          width: 20,
                          height: 20,
                        }}
                      />
                    </IconButton>
                  )}
                  <Menu
                    anchorEl={anchor}
                    open={Boolean(anchor)}
                    onClose={() => setAnchor(null)}
                    transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                  >
                    <MenuItem
                      disabled={user?.id !== campaign.dmId}
                      onClick={() => setModalState('edit')}
                    >
                      <EditIcon sx={{ width: 20, height: 20 }} />
                      &nbsp; Edit
                    </MenuItem>
                    <MenuItem
                      disabled={user?.id !== campaign.dmId}
                      onClick={() => setModalState('delete')}
                    >
                      <DeleteIcon sx={{ width: 20, height: 20 }} />
                      &nbsp; Delete
                    </MenuItem>
                  </Menu>
                  <CampaignActionsModal
                    campaign={campaign}
                    modalState={modalState}
                    handleClose={() => {
                      setModalState(null);
                      setAnchor(null);
                    }}
                  />
                </Stack>
              )}
            </>
          )}
        </Box>
      </Card>
    </div>
  );
};

const CampaignTabMemo = memo(CampaignTab, (prevProps, nextProps) => {
  return (
    prevProps.campaignId === nextProps.campaignId &&
    prevProps.displayActions === nextProps.displayActions
  );
});

const CampaignList = () => {
  const { user } = useUser();
  const [hoveredCampaignId, setHoveredCampaignId] = useState<string | null>(
    null
  );

  return (
    <>
      <Typography align={'center'} variant={'h3'}>
        Your Campaigns
      </Typography>
      {user && (
        <Grid container spacing={2}>
          {user.campaignIds.map((id, index) => (
            <Grid
              item
              key={index}
              xs={12}
              md={user.campaignIds.length <= 1 ? 12 : 6}
              onMouseEnter={() => setHoveredCampaignId(id)}
              onMouseLeave={() => setHoveredCampaignId(null)}
            >
              <CampaignTabMemo
                campaignId={id}
                displayActions={id === hoveredCampaignId}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
};
export default CampaignList;
