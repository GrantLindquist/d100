import { Box, IconButton, Stack, Typography, useTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { memo } from 'react';
import { SpotifyBase } from '@/types/Spotify';

const SpotifyItemTab = (props: {
  item: SpotifyBase,
  displayModifyButton: boolean,
  updateState: Function,
  isDeletingItem: boolean
}) => {
  const theme = useTheme();
  return (
    <Stack direction={'row'} alignItems={'center'} py={.5}>
      <Box flexGrow={1}>
        <Typography variant="subtitle1" lineHeight={1.1}>{props.item.title}</Typography>
        <Typography variant="subtitle2" color={'#666'}>{props.item.artistName ?? ''}</Typography>
      </Box>
      {props.displayModifyButton && (
        <IconButton onClick={() => props.updateState(props.item, props.isDeletingItem)}>
          {!props.isDeletingItem ? <AddIcon sx={{
            height: 20,
            width: 20,
            color: theme.palette.primary.main,
          }} /> : <RemoveIcon sx={{
            height: 20,
            width: 20,
            color: theme.palette.primary.main,
          }} />}
        </IconButton>
      )}
    </Stack>
  );
};

export const SpotifyItemTabMemo = memo(SpotifyItemTab, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.displayModifyButton === nextProps.displayModifyButton
  );
});