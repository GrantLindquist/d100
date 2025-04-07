import { ChangeEvent, useEffect, useState } from 'react';
import { doc, getDoc } from '@firebase/firestore';
import { Article } from '@/types/Unit';
import { Box, Pagination, Typography } from '@mui/material';
import { generateHTML } from '@tiptap/core';
import Paragraph from '@tiptap/extension-paragraph';
import Bold from '@tiptap/extension-bold';
import Blockquote from '@tiptap/extension-blockquote';
import Bulletlist from '@tiptap/extension-bullet-list';
import Document from '@tiptap/extension-document';
import EnforceTitle from '@/components/content/text-editor/EnforceTitle';
import Highlight from '@tiptap/extension-highlight';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import History from '@tiptap/extension-history';
import Italic from '@tiptap/extension-italic';
import ListItem from '@tiptap/extension-list-item';
import Link from '@tiptap/extension-link';
import Text from '@tiptap/extension-text';
import db from '@/utils/firebase';

// TODO: Fix yellow highlighting on hidden text
const EncounterAsideContent = (props: { article: Article }) => {

  const content = generateHTML(
    props.article.content,
    [
      Blockquote,
      Bulletlist,
      Bold,
      Document,
      EnforceTitle,
      Highlight,
      HardBreak,
      Heading.configure({
        levels: [2],
      }),
      History,
      Italic,
      ListItem,
      Link.configure({
        defaultProtocol: 'https',
        protocols: ['http', 'https'],
        isAllowedUri: (url, ctx) => {
          try {
            const parsedUrl = url.includes(':')
              ? new URL(url)
              : new URL(`${ctx.defaultProtocol}://${url}`);
            return ctx.defaultValidate(parsedUrl.href);
          } catch (error) {
            console.error(error);
            return false;
          }
        },
      }),
      Paragraph,
      Text,
    ],
  );

  return (
    <div dangerouslySetInnerHTML={{ __html: content }} />
  );
};

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

  // TODO: Make aside retractable
  return (
    <Box pt={8}>
      {articles.length ? (
        <>
          <Pagination
            count={articles.length}
            page={focusedArticleIndex + 1}
            onChange={handleChange}
            color="primary"
          />
          <EncounterAsideContent article={articles[focusedArticleIndex]} />
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