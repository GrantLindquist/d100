import { useEffect, useState } from 'react';
import { Box, Divider, Menu, MenuItem, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useAlert } from '@/hooks/useAlert';
import { getCookie } from '@/utils/cookie';
import { refreshAccessToken } from '@/components/SpotifyPlayer';
import { SpotifyItemTabMemo } from '@/components/data-list/SpotifyItemTab';
import { SpotifyBase } from '@/types/Spotify';
import SearchIcon from '@mui/icons-material/Search';

const SpotifyItemList = (props: { updateState: Function; spotifyItems?: SpotifyBase[]; isDeletingItem?: boolean }) => {

  const theme = useTheme();
  const { displayAlert } = useAlert();

  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [data, setData] = useState<SpotifyBase[]>([]);
  const [searchType, setSearchType] = useState<'tracks' | 'playlists'>('tracks');

  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    const scrubbedSearchTerm = searchTerm.replace(/[^A-Z0-9 ,?!/$:-]/gi, '').replace('+', '').trim();
    scrubbedSearchTerm.length > 0 && fetchSpotifyItems(scrubbedSearchTerm);
  }, [searchTerm, searchType]);

  const fetchSpotifyItems = async (searchTerm: string) => {
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
      if (searchType === 'playlists') {
        for (let item of data.playlists.items) {
          item && items.push({
            id: item.id,
            title: item.name,
            creatorName: item.owner.display_name,
            type: item.type,
            trackCount: item.tracks.total,
          } as SpotifyBase);
        }
      } else {
        for (let item of data.tracks.items) {
          items.push({
            id: item.id,
            title: item.name,
            creatorName: item.artists[0].name,
            type: item.type,
            albumArtUrl: item.album.images[2].url,
          } as SpotifyBase);
        }
      }
      setData(items);
    } catch (e: any) {
      displayAlert({
        isError: true,
        message: e.message,
      });
    }
  };

  const handleOpenMenu = (event: any) => {
    setMenuAnchor(event.currentTarget);
  };

  return (<Box px={1} height={'60vh'}>
    {!props.spotifyItems &&
      <TextField
        onKeyDown={(e) => e.stopPropagation()}
        variant={'outlined'}
        size={'small'}
        onChange={(event) => setSearchTerm(event.target.value)}
        fullWidth
        placeholder={'Search'}
        sx={{
          marginBottom: 2,
          backgroundColor: '#222222',
          borderRadius: 1,
          color: '#DDDDDD',
          '& fieldset': { border: 'none' },
        }}
        slotProps={{
          input: {
            startAdornment: <SearchIcon style={{ marginRight: 6, color: 'grey', width: 20 }} />,
            endAdornment: (
              <>
                <Typography onClick={handleOpenMenu} color={theme.palette.primary.main} sx={{ cursor: 'pointer' }}>
                  {searchType}
                </Typography>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                  transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                >
                  <MenuItem onClick={() => setSearchType('tracks')}>Tracks</MenuItem>
                  <MenuItem onClick={() => setSearchType('playlists')}>Playlists</MenuItem>
                </Menu>
              </>
            ),
          },
        }}
      />
    }
    {!props.spotifyItems && !searchTerm ?
      <Box textAlign={'center'}>
        <Typography color={'grey'} variant={'subtitle2'} px={4}>
          Try searching for tracks, albums, or playlists to add to associate with this article.
        </Typography>
      </Box> : <>{(props.spotifyItems || data).map((result: SpotifyBase) => <Box
        key={result.id}>
        <Stack direction={'row'}>
          <Stack direction={'column'} width={'100%'}>
            <Box
              onMouseEnter={() => setHoveredItemId(result.id)}
              onMouseLeave={() => setHoveredItemId(null)}
            >
              <SpotifyItemTabMemo
                item={result}
                displayModifyButton={result.id === hoveredItemId}
                updateState={props.updateState}
                isDeletingItem={Boolean(props.isDeletingItem)}
                albumArtUrl={result.albumArtUrl}
              />
            </Box>
          </Stack>
        </Stack>
        <Divider />
      </Box>)}</>}
  </Box>);
};
export default SpotifyItemList;