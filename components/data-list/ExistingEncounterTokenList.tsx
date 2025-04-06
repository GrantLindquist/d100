import { Box, Stack, Typography } from '@mui/material';
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
    <Stack direction={'row'} alignItems={'center'} py={.5} sx={{ cursor: 'pointer' }}>
      {image &&
        <Image style={{ marginRight: 10 }} src={image.src} alt={'Album cover art'} height={40 / image.ratio}
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
          isError: true,
          errorType: e.message,
        });
      }
    }

    fetchEnabledArticles();
  }, []);

  return <>
    <Typography>
      Existing Tokens
    </Typography>
    {enabledArticles.map((article) => {
      const isSelected = article.id === props.selectedArticle?.id;
      return <Box py={.5} key={article.id} onClick={() => props.selectArticle(!isSelected ? article : null)} sx={
        isSelected ? { backgroundColor: '#333' } : {}
      }>
        <EnabledArticleTab article={article} />
      </Box>;
    })}
  </>;
};
export default ExistingEncounterTokenList;