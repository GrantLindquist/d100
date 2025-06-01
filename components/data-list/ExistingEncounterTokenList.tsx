import { Box, Divider, Stack, TextField, Typography } from '@mui/material';
import { Article } from '@/types/Unit';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from '@firebase/firestore';
import db from '@/utils/firebase';
import { useAlert } from '@/hooks/useAlert';
import { useCampaign } from '@/hooks/useCampaign';
import Image from 'next/image';

const EnabledArticleTab = (props: { article: Article }) => {
  const image = props.article.imageUrls.length > 0 ? props.article.imageUrls[0] : null;
  return (
    <Stack direction={'row'} alignItems={'center'} sx={{ cursor: 'pointer' }}>
      {image &&
        <Image style={{ marginRight: 10 }} src={image.src} alt={'Album cover art'} height={40}
               width={40} />}
      <Box flexGrow={1}>
        <Typography variant="subtitle1" lineHeight={1.1}>{props.article.title}</Typography>
      </Box>
    </Stack>
  );
};

const ExistingEncounterTokenList = (props: { selectArticle: Function; selectedArticle: Article | null }) => {

  const { displayAlert } = useAlert();
  const { campaign } = useCampaign();

  const [enabledArticles, setEnabledArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchEnabledArticles() {
      try {
        const q = query(collection(db, 'units'),
          where('campaignId', '==', campaign!.id),
          where('hasEncounterToken', '==', true),
        );
        const querySnapshot = await getDocs(q);
        setEnabledArticles(querySnapshot.docs.map((doc) => doc.data() as Article));
      } catch (e: any) {
        displayAlert({
          message: 'An error occurred while fetching your articles.',
          errorType: e.message,
        });
      }
    }

    fetchEnabledArticles();
  }, [props.selectedArticle]);

  return <>
    <TextField
      variant={'outlined'}
      size={'small'}
      onChange={(event) => setSearchTerm(event.target.value)}
      fullWidth
      placeholder={'Search Articles'}
      sx={{
        backgroundColor: '#222222',
        color: '#DDDDDD',
        '& fieldset': { border: 'none' },
      }} />
    <Divider sx={{ mx: 1 }} />
    <Box py={1}>
      {enabledArticles.map((article) => {
        if (article.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          const isSelected = article.id === props.selectedArticle?.id;
          return <Box key={article.id} px={1} py={.5} onClick={() => props.selectArticle(!isSelected ? article : null)}
                      sx={
                        isSelected ? { backgroundColor: '#444' } : {
                          ':hover': {
                            backgroundColor: '#444',
                          },
                        }
                      }>
            <EnabledArticleTab article={article} />
          </Box>;
        }
        return null;
      })}
    </Box>
  </>;
};
export default ExistingEncounterTokenList;