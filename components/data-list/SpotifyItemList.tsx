import { useEffect, useState } from 'react';
import { Box, Divider, Menu, MenuItem, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useAlert } from '@/hooks/useAlert';
import { getCookie } from '@/utils/cookie';
import { refreshAccessToken } from '@/components/SpotifyPlayer';
import { SpotifyItemTabMemo } from '@/components/data-list/SpotifyItemTab';
import { Playlist, SpotifyBase } from '@/types/Spotify';
import SearchIcon from '@mui/icons-material/Search';
import { collection, getDocs, query, where } from '@firebase/firestore';
import db from '@/utils/firebase';
import { useCampaign } from '@/hooks/useCampaign';

const searchTypeEnum = {
  tracks: 'Tracks',
  playlistCustom: 'Custom Playlists',
  playlistSpotify: 'Playlists',
};

const SpotifyItemList = (props: {
  updateState: Function;
  items?: (SpotifyBase | Playlist)[];
  isDeletingItem?: boolean
}) => {

  const theme = useTheme();
  const { displayAlert } = useAlert();
  const { campaign } = useCampaign();

  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [data, setData] = useState<(SpotifyBase | Playlist)[]>([]);
  const [searchType, setSearchType] = useState<'tracks' | 'playlistSpotify' | 'playlistCustom'>('tracks');

  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    if (searchType === 'playlistCustom') {
      fetchCustomPlaylists();
    } else {
      const scrubbedSearchTerm = searchTerm.replace(/[^A-Z0-9 ,?!/$:-]/gi, '').replace('+', '').trim();
      scrubbedSearchTerm.length > 0 && fetchSpotifyItems(scrubbedSearchTerm);
    }
  }, [searchTerm, searchType]);

  const fetchCustomPlaylists = async () => {
    let results: Playlist[] = [];
    const q = query(collection(db, 'playlists'), where('id', 'in', campaign!.playlistIds));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      results.push(doc.data() as Playlist);
    });
    setData(results);
  };

  const fetchSpotifyItems = async (searchTerm: string) => {
    try {
      let accessToken;
      const tokenCookie = await getCookie('spotify_access_token');
      if (Date.now() > tokenCookie?.obj?.expiresAt) {
        accessToken = await refreshAccessToken();
      } else {
        accessToken = tokenCookie?.obj;
      }
      const response = await fetch(`https://api.spotify.com/v1/search?q=${searchTerm}&type=track%2Cplaylist&limit=10`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + accessToken.token,
        },
      });
      const data = await response.json();
      let items: SpotifyBase[] = [];
      if (searchType === 'playlistSpotify') {
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
        errorType: e.message,
        message: 'An error occurred while fetching items from Spotify.',
      });
    }
  };

  const handleOpenMenu = (event: any) => {
    setMenuAnchor(event.currentTarget);
  };

  return (<Box px={1} height={'60vh'}>
    {!props.items &&
      <TextField
        onKeyDown={(e) => e.stopPropagation()}
        variant={'outlined'}
        size={'small'}
        onChange={(event) => setSearchTerm(event.target.value)}
        fullWidth
        disabled={searchType === 'playlistCustom'}
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
                <Typography onClick={handleOpenMenu} color={theme.palette.primary.main}
                            sx={{
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}>
                  {searchTypeEnum[searchType]}
                </Typography>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                  transformOrigin={{ horizontal: 'center', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
                >
                  <MenuItem onClick={() => setSearchType('tracks')}>Tracks</MenuItem>
                  <MenuItem onClick={() => setSearchType('playlistSpotify')}>Playlists (Spotify)</MenuItem>
                  <MenuItem onClick={() => setSearchType('playlistCustom')}>Playlists (Custom)</MenuItem>
                </Menu>
              </>
            ),
          },
        }}
      />
    }
    {!props.items && !searchTerm ?
      <Box textAlign={'center'}>
        <Typography color={'grey'} variant={'subtitle2'} px={4}>
          Try searching for tracks, albums, or playlists to add to associate with this article.
        </Typography>
      </Box> : <>{(props.items || data).map((result: SpotifyBase | Playlist) => <Box
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
                albumArtUrl={'albumArtUrl' in result ? result.albumArtUrl : undefined}
              />
            </Box>
          </Stack>
        </Stack>
        <Divider />
      </Box>)}</>}
  </Box>);
};
export default SpotifyItemList;