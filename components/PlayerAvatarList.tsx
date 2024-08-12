import { useEffect, useState } from 'react';
import { Avatar, Stack, Tooltip, Typography } from '@mui/material';
import { doc, getDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { User } from '@/types/User';

const PlayerAvatarList = (props: { playerIds: string[] }) => {
  const [players, setPlayers] = useState<User[]>([]);

  useEffect(() => {
    const fetchPlayerAvatarUrls = async () => {
      let players = [];
      for (let id of props.playerIds) {
        const playerDocSnap = await getDoc(doc(db, 'users', id));
        if (playerDocSnap.exists()) {
          players.push(playerDocSnap.data() as User);
        }
      }
      setPlayers(players);
    };
    fetchPlayerAvatarUrls();
  }, [props.playerIds]);

  return (
    <Stack direction={'row'} spacing={-1} alignItems={'center'}>
      <Typography variant={'subtitle2'} color={'grey'} pr={3}>
        {players.length}&nbsp;player
        {players.length > 1 ? 's' : ''}
      </Typography>
      {players.map((player, index) => (
        <Tooltip key={player.id} title={player.displayName}>
          <Avatar
            src={player.photoURL ?? ''}
            alt={player.displayName ?? 'Player'}
            sx={{
              width: 30,
              height: 30,
              zIndex: players.length - index,
              border: (theme) =>
                `2px ${theme.palette.background.default} solid`,
            }}
          />
        </Tooltip>
      ))}
    </Stack>
  );
};
export default PlayerAvatarList;
