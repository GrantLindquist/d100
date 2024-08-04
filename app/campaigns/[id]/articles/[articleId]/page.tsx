'use client';

import {
  Box,
  Container,
  Fab,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Article, Section } from '@/types/Scoop';
import { doc, getDoc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { generateUUID } from '@/utils/uuid';
import { useUser } from '@/hooks/useUser';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ArticleAside from '@/components/ArticleAside';

export default function ArticlePage({
  params,
}: {
  params: { articleId: string };
}) {
  const [article, setArticle] = useState<Article | null>(null);
  const [isEditing, setEditing] = useState<boolean>(false);
  const [isAdding, setAdding] = useState<boolean>(false);
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);

  const sectionsFormRef = useRef<HTMLFormElement>(null);

  const { user } = useUser();

  useEffect(() => {
    const fetchArticle = async () => {
      const articleDocSnap = await getDoc(doc(db, 'scoops', params.articleId));
      if (articleDocSnap.exists()) {
        setArticle(articleDocSnap.data() as Article);
      }
    };
    fetchArticle();
  }, [params.articleId]);

  // TODO: Cannot read trim of undefined (reading title) - does not work if isEditing is false
  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (article) {
      const formData = new FormData(event.currentTarget);
      const sectionsData = article.sections
        .map((section) => {
          const title = formData.get(`title-${section.id}`) as string;
          const body = formData.get(`body-${section.id}`) as string;

          if (title.trim() && body.trim()) {
            return {
              id: section.id,
              isHeader: section.isHeader || false,
              authorId: section.authorId || '',
              title,
              body,
            } as Section;
          }
          return null;
        })
        .filter((section): section is Section => section !== null);

      const newArticle = {
        ...article,
        sections: sectionsData,
      };
      setArticle(newArticle);
      isEditing && setEditing(false);
      isAdding && setAdding(false);

      await updateDoc(doc(db, 'scoops', params.articleId), {
        sections: sectionsData,
      });
    }
  };

  const handleAddSection = () => {
    if (article && user) {
      setAdding(true);
      const newSection = {
        id: generateUUID(),
        title: '',
        body: '',
        isHeader: false,
        authorId: user.id,
      };

      const newArticle = {
        ...article,
        sections: [...article.sections, newSection],
      };
      setArticle(newArticle);
    }
  };

  const handleDeleteSection = () => {
    if (article) {
      const newArticle = {
        ...article,
        sections: [...article.sections].filter(
          (a) => a.id !== focusedSectionId
        ),
      };
      setFocusedSectionId(null);
      setArticle(newArticle);
    }
  };

  const Section = (props: { section: Section }) => {
    return (
      <>
        <Typography variant={props.section.isHeader ? 'h2' : 'h4'} py={1}>
          {props.section.title}
        </Typography>
        <Typography py={1}>{props.section.body}</Typography>
      </>
    );
  };

  // TODO: Figure out how to have my cake (onFocus id state) and eat it too (one click to access TextField)
  const EditableSection = (props: { section: Section }) => {
    return (
      <>
        <TextField
          name={`title-${props.section.id}`}
          defaultValue={props.section.title}
          placeholder="Section Title"
          // onFocus={() => setFocusedSectionId(props.section.id)}
          sx={{
            '& .MuiInputBase-input': {
              fontSize: '2rem',
              fontStyle: 'italic',
              py: 1,
              px: 0,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
          }}
          fullWidth
        />
        <TextField
          name={`body-${props.section.id}`}
          defaultValue={props.section.body}
          placeholder="Section Body"
          // onFocus={() => setFocusedSectionId(props.section.id)}
          sx={{
            '& .MuiInputBase-input': {
              fontStyle: 'italic',
            },
            '& .MuiInputBase-root': {
              px: 0,
              py: 1,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
          }}
          multiline
          fullWidth
        />
      </>
    );
  };

  return (
    <Container sx={{ paddingY: 3 }}>
      {article && (
        <Grid container spacing={3}>
          <Grid item xs={3}>
            {/*<Breadcrumbs aria-label="breadcrumb">*/}
            {/*  <Link href="/">MUI</Link>*/}
            {/*  <Link href="/material-ui/getting-started/installation/">*/}
            {/*    Core*/}
            {/*  </Link>*/}
            {/*  <Typography>Breadcrumbs</Typography>*/}
            {/*</Breadcrumbs>*/}
            <ArticleAside article={article} />
          </Grid>
          <Grid item xs={8}>
            <Box pl={3}>
              <form ref={sectionsFormRef} onSubmit={handleSave}>
                {article.sections.map((section, index) => (
                  <div key={index}>
                    <Box
                      sx={
                        isEditing ||
                        (section.title.length <= 0 && section.body.length <= 0)
                          ? {}
                          : { display: 'none' }
                      }
                    >
                      <EditableSection section={section} />
                    </Box>
                    <Box sx={!isEditing ? {} : { display: 'none' }}>
                      <Section section={section} />
                    </Box>
                  </div>
                ))}
              </form>
            </Box>
          </Grid>
        </Grid>
      )}
      <Stack
        direction="column"
        spacing={1}
        p={3}
        sx={{
          position: 'fixed',
          right: 16,
          bottom: 16,
        }}
      >
        <Fab size="small" onClick={handleAddSection}>
          <AddIcon />
        </Fab>
        {isEditing ? (
          <Fab
            size="small"
            onClick={() => {
              sectionsFormRef.current &&
                sectionsFormRef.current.dispatchEvent(
                  new Event('submit', {
                    cancelable: true,
                    bubbles: true,
                  })
                );
            }}
          >
            Save
          </Fab>
        ) : (
          <Fab size="small" onClick={() => setEditing(true)}>
            <EditIcon />
          </Fab>
        )}

        <Fab
          size="small"
          disabled={!Boolean(focusedSectionId)}
          onClick={handleDeleteSection}
        >
          Del
        </Fab>
      </Stack>
    </Container>
  );
}
