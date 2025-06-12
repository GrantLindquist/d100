import { Box, IconButton, Stack, Typography, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { memo } from 'react';
import { Playlist, SpotifyBase } from '@/types/Spotify';
import Image from 'next/image';

// Type Guard to distinguish Playlist from SpotifyBase
const isPlaylist = (item: SpotifyBase | Playlist): item is Playlist => {
  return 'spotifyItems' in item;
};

const SpotifyItemTab = (props: {
  item: SpotifyBase | Playlist,
  displayModifyButton: boolean,
  updateState: Function,
  isDeletingItem: boolean
  albumArtUrl?: string;
}) => {
  const theme = useTheme();

  return (
    <Stack direction={'row'} alignItems={'center'} py={0.5}>
      {props.albumArtUrl && (
        <Image
          style={{ marginRight: 10 }}
          src={props.albumArtUrl}
          alt={'Album cover art'}
          height={40}
          width={40}
        />
      )}

      <Box flexGrow={1}>
        <Typography variant="subtitle1" lineHeight={1.1}>
          {props.item.title}
        </Typography>
        {isPlaylist(props.item) ? (
          <Typography variant="subtitle2" color={'#666'}>
            {`${props.item.spotifyItems.length} track${props.item.spotifyItems.length > 1 ? 's' : ''}`}
          </Typography>
        ) : (
          <Typography variant="subtitle2" color={'#666'}>
            {props.item.creatorName}
            {props.item.trackCount && ` - ${props.item.trackCount} tracks`}
          </Typography>
        )}
      </Box>

      {props.displayModifyButton && (
        <IconButton onClick={() => props.updateState(props.item, props.isDeletingItem)}>
          {!props.isDeletingItem ? (
            <AddIcon
              sx={{
                height: 20,
                width: 20,
                color: theme.palette.primary.main,
              }}
            />
          ) : (
            <RemoveIcon
              sx={{
                height: 20,
                width: 20,
                color: theme.palette.primary.main,
              }}
            />
          )}
        </IconButton>
      )}
    </Stack>
  );
};

// Memoized version
export const SpotifyItemTabMemo = memo(
  SpotifyItemTab,
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.displayModifyButton === nextProps.displayModifyButton &&
      prevProps.isDeletingItem === nextProps.isDeletingItem
    );
  },
);