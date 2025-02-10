'use client';
import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import { useCampaign } from '@/hooks/useCampaign';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { useUser } from '@/hooks/useUser';
import { UserBase } from '@/types/User';
import {
  arrayRemove,
  doc,
  onSnapshot,
  runTransaction,
} from '@firebase/firestore';
import db from '@/utils/firebase';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAlert } from '@/hooks/useAlert';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';

const PlayerList = (props: { players: UserBase[] }) => {
  const { user } = useUser();
  const { campaign } = useCampaign();
  const { displayAlert } = useAlert();

  const [hoveredPlayer, setHoveredPlayer] = useState<UserBase | null>(null);

  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);

  const handleClick = (event: any) => {
    setAnchor(event.currentTarget);
  };

  const handleKickPlayer = async () => {
    if (campaign && hoveredPlayer) {
      try {
        setAnchor(null);
        await runTransaction(db, async (transaction) => {
          transaction.update(doc(db, 'campaigns', campaign.id), {
            players: arrayRemove(hoveredPlayer),
          });
          transaction.update(doc(db, 'users', hoveredPlayer.id), {
            campaignIds: arrayRemove(campaign.id),
          });
        });
        displayAlert({
          message: `${hoveredPlayer.displayName} was kicked from the campaign.`,
        });
      } catch (e: any) {
        displayAlert({
          message: `An error occurred while kicking ${hoveredPlayer.displayName}.`,
          isError: true,
          errorType: e.message,
        });
      }
    }
  };

  const handleHoverPlayer = (player: UserBase | null) => {
    if (anchor === null) {
      setHoveredPlayer(player);
    }
  };

  return (
    <Box onMouseLeave={() => handleHoverPlayer(null)}>
      {props.players.map((player, index) => {
        if (player.id !== user?.id) {
          return (
            <MenuItem key={index} onMouseOver={() => handleHoverPlayer(player)}>
              <Avatar
                src={player.photoURL ?? '-'}
                alt={player.displayName ?? 'Player'}
                sx={{
                  width: 20,
                  height: 20,
                  mr: 1,
                }}
              />
              <Typography flexGrow={1}>{player.displayName}</Typography>

              <IconButton
                disabled={player.id !== hoveredPlayer?.id}
                disableRipple
                disableFocusRipple
                onClick={handleClick}
                sx={{
                  padding: 0,
                }}
              >
                {player.id === hoveredPlayer?.id && (
                  <MoreVertIcon
                    sx={{
                      width: 20,
                      height: 20,
                    }}
                  />
                )}
              </IconButton>

              <Menu
                anchorEl={anchor}
                open={open}
                onClose={() => setAnchor(null)}
                transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                disableScrollLock
              >
                <MenuItem onClick={handleKickPlayer}>Kick Player</MenuItem>
                <MenuItem disabled>Change Permissions</MenuItem>
              </Menu>
            </MenuItem>
          );
        }
      })}
    </Box>
  );
};

const SettingsButton = () => {
  const { campaign } = useCampaign();
  const { spotifyAuthenticated, displayPlayer, setDisplayPlayer } =
    useSpotifyPlayer();

  const [anchor, setAnchor] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const open = Boolean(anchor);

  const [players, setPlayers] = useState<UserBase[]>([]);
  useEffect(() => {
    if (campaign) {
      const unsubscribe = onSnapshot(
        doc(db, 'campaigns', campaign.id),
        (campaignDocSnap) => {
          if (campaignDocSnap.exists()) {
            setPlayers(campaignDocSnap.data().players);
          }
        }
      );

      return () => unsubscribe();
    }
  }, [campaign?.id]);

  const handleClick = (event: any) => {
    setAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
    setTimeout(() => {
      setCopiedId(false);
    }, 500);
  };

  const handleCopyCampaignId = async () => {
    campaign?.id && (await navigator.clipboard.writeText(campaign.id));
    setCopiedId(true);
  };

  return (
    <>
      <Tooltip title={'Settings'}>
        <IconButton onClick={handleClick}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        disableScrollLock
      >
        {campaign && players.length > 1 && (
          <div>
            <Box px={2} py={1}>
              Manage Players:
            </Box>
            <PlayerList players={players} />
          </div>
        )}
        <Box px={2} py={1}>
          <Typography>Invite players:</Typography>
          <Paper sx={{ mt: 1 }}>
            <Stack px={1} direction={'row'}>
              <Typography
                variant={'subtitle2'}
                sx={{ fontFamily: 'monospace', p: 1 }}
              >
                {campaign?.id}
              </Typography>
              <IconButton
                onClick={handleCopyCampaignId}
                sx={{
                  ':hover': {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                {copiedId ? (
                  <CheckIcon sx={{ width: 16, height: 16, color: 'green' }} />
                ) : (
                  <ContentCopyIcon sx={{ width: 16, height: 16 }} />
                )}
              </IconButton>
            </Stack>
          </Paper>
        </Box>
        {spotifyAuthenticated && (
          <MenuItem onClick={() => setDisplayPlayer(!displayPlayer)}>
            <Stack direction={'row'}>
              <img src={'/spotify.svg'} style={{ width: 24, marginRight: 6 }} />
              {displayPlayer ? 'Hide Player' : 'Show Player'}
            </Stack>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default SettingsButton;
