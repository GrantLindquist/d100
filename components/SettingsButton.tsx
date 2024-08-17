'use client';
import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import { useCampaign } from '@/hooks/useCampaign';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { useUser } from '@/hooks/useUser';

const SettingsButton = () => {
  const { campaign } = useCampaign();
  const { user } = useUser();

  const [anchor, setAnchor] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const open = Boolean(anchor);

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
      <IconButton onClick={handleClick}>
        <SettingsIcon />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        {campaign && campaign.players.length > 1 && (
          <>
            <Box px={2} py={1}>
              Manage Players:
            </Box>
            {campaign.players.map((player, index) => {
              if (player.id !== user?.id) {
                return (
                  <MenuItem key={index}>
                    <Avatar
                      src={player.photoURL ?? ''}
                      alt={player.displayName ?? 'Player'}
                      sx={{
                        width: 30,
                        height: 30,
                      }}
                    />
                    <Typography>{player.displayName}</Typography>
                  </MenuItem>
                );
              }
            })}
          </>
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
      </Menu>
    </>
  );
};

export default SettingsButton;
