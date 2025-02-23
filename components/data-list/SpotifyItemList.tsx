import { useEffect, useState } from 'react';
import { Box, Divider, Stack, TextField } from '@mui/material';
import { useAlert } from '@/hooks/useAlert';
import { getCookie } from '@/utils/cookie';
import { refreshAccessToken } from '@/components/SpotifyPlayer';
import { SpotifyItemTabMemo } from '@/components/data-list/SpotifyItemTab';
import { SpotifyBase } from '@/types/Spotify';

// TODO: Memoize so that hoveredItemId doesn't rerender entire list
const SpotifyItemList = (props: { updateState: Function; spotifyItems?: SpotifyBase[]; isDeletingItem?: boolean }) => {

  const { displayAlert } = useAlert();

  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [data, setData] = useState<SpotifyBase[]>([]);

  useEffect(() => {
    searchTerm.length > 0 && fetchSpotifySearchTerm(searchTerm);
  }, [searchTerm]);

  const fetchSpotifySearchTerm = async (searchTerm: string) => {
    try {
      let accessToken;
      const tokenCookie = await getCookie('spotify_access_token');
      if (Date.now() > tokenCookie.obj.expiresAt) {
        accessToken = await refreshAccessToken();
      } else {
        accessToken = tokenCookie.obj;
      }
      const response = await fetch(`https://api.spotify.com/v1/search?q=${searchTerm}&type=album%2Ctrack%2Cplaylist&limit=10`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + accessToken.token,
        },
      });
      const data = await response.json();
      let items: SpotifyBase[] = [];
      for (let item of data.tracks.items) {
        items.push({
          id: item.id,
          title: item.name,
          artistName: item.artists[0].name,
          type: item.type,
        } as SpotifyBase);
      }
      setData(items);
    } catch (e: any) {
      displayAlert({
        isError: true,
        message: e.message,
      });
    }
  };

  return (<Box>
    {!props.spotifyItems &&
      <TextField
        variant={'outlined'}
        size={'small'}
        onChange={(event) => setSearchTerm(event.target.value)}
        fullWidth
        placeholder={'Search'}
        sx={{
          marginBottom: 5,
          backgroundColor: '#222222',
          borderRadius: 1,
          color: '#DDDDDD',
          '& fieldset': { border: 'none' },
        }}
      />
    }
    {(props.spotifyItems || data).map((result: SpotifyBase) => <Box key={result.id}>
      <Stack direction={'row'}>
        <Stack direction={'column'}>
          <Box
            onMouseEnter={() => setHoveredItemId(result.id)}
            onMouseLeave={() => setHoveredItemId(null)}
          >
            <SpotifyItemTabMemo
              item={result}
              displayModifyButton={result.id === hoveredItemId}
              updateState={props.updateState}
              isDeletingItem={Boolean(props.isDeletingItem)} />
          </Box>
        </Stack>
      </Stack>
      <Divider />
    </Box>)}
  </Box>);
};
export default SpotifyItemList;