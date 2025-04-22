import { ChangeEvent, useEffect, useState } from 'react';
import { doc, getDoc } from '@firebase/firestore';
import { Article } from '@/types/Unit';
import { Box, Pagination, Typography } from '@mui/material';
import db from '@/utils/firebase';
import { ContentEditor } from '@/components/content/PageContent';

const EncounterAside = (props: { articleIds: string[] }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [focusedArticleIndex, setFocusedArticleIndex] = useState<number>(0);

  const handleChange = (event: ChangeEvent<unknown>, value: number) => {
    setFocusedArticleIndex(value - 1);
  };

  useEffect(() => {
    const fetchArticles = async () => {
      const fetchedArticles = await Promise.all(
        props.articleIds.map(async (id) => {
          const docRef = doc(db, 'units', id);
          const docSnap = await getDoc(docRef);
          return docSnap.exists() ? docSnap.data() : null;
        }),
      );
      const results = fetchedArticles.filter(Boolean) as Article[];
      setArticles(results);
    };

    if (props.articleIds.length) {
      fetchArticles();
    }
  }, [props.articleIds]);

  return (
    <Box pt={5}>
      {articles.length ? (
        <>
          <Pagination
            count={articles.length}
            page={focusedArticleIndex + 1}
            onChange={handleChange}
            color="primary"
            sx={{ marginBottom: 3 }}
          />
          {articles[focusedArticleIndex] &&
            <ContentEditor displayHiddenMarks compactView unitId={articles[focusedArticleIndex].id} />}
        </>
      ) : (
        <Typography textAlign="center" color="grey">
          There are no tokens with articles attached to them.
        </Typography>
      )}
    </Box>
  );
};

export default EncounterAside;