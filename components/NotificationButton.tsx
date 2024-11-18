import { ReactNode, useEffect, useState } from 'react';
import {
  arrayRemove,
  arrayUnion,
  doc,
  onSnapshot,
  runTransaction,
  updateDoc,
} from '@firebase/firestore';
import db from '@/utils/firebase';
import { useCampaign } from '@/hooks/useCampaign';
import {
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import BellIcon from '@mui/icons-material/Notifications';
import { UserBase } from '@/types/User';
import { useAlert } from '@/hooks/useAlert';

interface Notification {
  message: string;
  action?: ReactNode;
}

const PendingPlayerAction = (props: {
  campaignId: string;
  player: UserBase;
}) => {
  const { displayAlert } = useAlert();
  const campaignDoc = doc(db, 'campaigns', props.campaignId);

  const handleAcceptPlayer = async () => {
    try {
      await runTransaction(db, async (transaction) => {
        transaction.update(campaignDoc, {
          pendingPlayers: arrayRemove(props.player),
        });
        transaction.update(campaignDoc, {
          players: arrayUnion(props.player),
        });
        transaction.update(doc(db, 'users', props.player.id), {
          campaignIds: arrayUnion(props.campaignId),
        });
      });
    } catch (e: any) {
      displayAlert({
        message: `An error occurred while accepting the player.`,
        isError: true,
        errorType: e.message,
      });
    }
  };

  const handleDenyPlayer = async () => {
    try {
      await updateDoc(campaignDoc, {
        pendingPlayers: arrayRemove(props.player),
      });
    } catch (e: any) {
      displayAlert({
        message: `An error occurred while denying the player.`,
        isError: true,
        errorType: e.message,
      });
    }
  };

  return (
    <Stack direction={'row'}>
      <Box flexGrow={1}></Box>
      <Button size={'small'} onClick={handleAcceptPlayer}>
        Accept
      </Button>
      <Button size={'small'} onClick={handleDenyPlayer}>
        Deny
      </Button>
    </Stack>
  );
};

const NotificationButton = () => {
  const { campaign } = useCampaign();
  const { displayAlert } = useAlert();

  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (campaign) {
      try {
        const unsubscribe = onSnapshot(
          doc(db, 'campaigns', campaign.id),
          (campaignDocSnap) => {
            let notificationData: Notification[] = [];
            if (campaignDocSnap.exists()) {
              for (let player of campaignDocSnap.data().pendingPlayers) {
                notificationData.push({
                  message: `${player.displayName} has requested to join your campaign.`,
                  action: (
                    <PendingPlayerAction
                      campaignId={campaign.id}
                      player={player}
                    />
                  ),
                });
              }
              setNotifications(notificationData);
            }
          }
        );

        return () => unsubscribe();
      } catch (e: any) {
        displayAlert({
          message: `An error occurred while loading notifications.`,
          isError: true,
          errorType: e.message,
        });
      }
    }
  }, [campaign?.id]);

  const handleClick = (event: any) => {
    setAnchor(event.currentTarget);
  };

  return (
    <>
      <Badge
        badgeContent={notifications.length}
        overlap={'circular'}
        color={'primary'}
      >
        <Tooltip title={'Notifications'}>
          <IconButton onClick={handleClick}>
            <BellIcon />
          </IconButton>
        </Tooltip>
      </Badge>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        <Box sx={{ maxWidth: 300, maxHeight: 300 }}>
          {notifications.length > 0 ? (
            <>
              {notifications.map((notification, index) => {
                return (
                  <div key={index}>
                    <Box px={2} py={1}>
                      <Typography variant={'subtitle2'}>
                        {notification.message}
                      </Typography>
                      {notification.action}
                    </Box>
                    {index < notifications.length - 1 && <Divider />}
                  </div>
                );
              })}
            </>
          ) : (
            <Box px={2} py={1}>
              <Typography variant={'subtitle2'} sx={{ color: 'grey' }}>
                You have no active notifications.
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>
    </>
  );
};
export default NotificationButton;
