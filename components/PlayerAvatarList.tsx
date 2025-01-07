import { Avatar, Stack, Tooltip, Typography } from '@mui/material';
import { UserBase } from '@/types/User';

const PlayerAvatarList = (props: { players: UserBase[] }) => {
  return (
    <Stack direction={'row'} spacing={-1} alignItems={'center'}>
      <Typography variant={'subtitle2'} color={'grey'} pr={3}>
        {props.players.length}&nbsp;player
        {props.players.length > 1 ? 's' : ''}
      </Typography>
      {props.players.map((player, index) => (
        <div key={index}>
          <Tooltip title={player.displayName}>
            <Avatar
              src={player.photoURL ?? '-'}
              alt={player.displayName ?? 'Player'}
              sx={{
                width: 30,
                height: 30,
                zIndex: props.players.length - index,
                border: () => `2px #121212 solid`,
              }}
            />
          </Tooltip>
        </div>
      ))}
    </Stack>
  );
};
export default PlayerAvatarList;
