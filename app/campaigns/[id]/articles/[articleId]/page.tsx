'use client';

import {
  Box,
  Button,
  Container,
  Stack,
  TextareaAutosize,
  Typography,
} from '@mui/material';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Article, Section } from '@/types/Scoop';
import { doc, getDoc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { generateUUID } from '@/utils/uuid';

export default function ArticlePage({
  params,
}: {
  params: { articleId: string };
}) {
  const [article, setArticle] = useState<Article | null>(null);
  const [isEditing, setEditing] = useState<boolean>(false);

  const sectionsFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      const articleDocSnap = await getDoc(doc(db, 'scoops', params.articleId));
      if (articleDocSnap.exists()) {
        setArticle(articleDocSnap.data() as Article);
      }
    };
    fetchArticle();
  }, [params.articleId]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEditing(false);

    if (article) {
      const formData = new FormData(event.currentTarget);
      const sectionsData = article.sections.map(
        (section) =>
          ({
            id: section.id,
            isHeader: section.isHeader || false,
            title: formData.get(`title-${section.id}`),
            body: formData.get(`body-${section.id}`),
          }) as Section
      );

      const newArticle = {
        ...article,
        sections: sectionsData,
      };
      setArticle(newArticle);

      await updateDoc(doc(db, 'scoops', params.articleId), {
        sections: sectionsData,
      });
    }
  };

  const handleAddSection = () => {
    if (article) {
      const newSection = {
        id: generateUUID(),
        title: '',
        body: '',
        isHeader: false,
      };

      const newArticle = {
        ...article,
        sections: [...article.sections, newSection],
      };
      setArticle(newArticle);
    }
  };

  const Sections = (props: { sections: Section[] }) => {
    return (
      <Stack direction={'column'} spacing={3}>
        {props.sections.map((section, index) => (
          <div key={index}>
            <Typography variant={section.isHeader ? 'h2' : 'h4'}>
              {section.title}
            </Typography>
            <Typography>{section.body}</Typography>
          </div>
        ))}
      </Stack>
    );
  };

  const EditableSections = (props: { sections: Section[] }) => {
    return (
      <Stack direction={'column'} spacing={3}>
        <form ref={sectionsFormRef} onSubmit={handleSave}>
          {props.sections.map((section, index) => (
            <div key={index}>
              <TextareaAutosize
                name={`title-${section.id}`}
                defaultValue={section.title}
                placeholder={'Section Title'}
              />
              <TextareaAutosize
                name={`body-${section.id}`}
                defaultValue={section.body}
                placeholder={'Section Body'}
              />
            </div>
          ))}
        </form>
      </Stack>
    );
  };

  return (
    <Container
      sx={{
        paddingY: 3,
      }}
    >
      {article && (
        <Stack direction={'row'} spacing={2}>
          <Box
            sx={{
              width: '30%',
            }}
          >
            omg hi
          </Box>
          <Box
            sx={{
              width: '70%',
            }}
          >
            {!isEditing ? (
              <>
                <Sections sections={article.sections} />
                <Button onClick={() => setEditing(true)}>Toggle Editing</Button>
              </>
            ) : (
              <>
                <EditableSections sections={article.sections} />
                <Stack direction={'row'} spacing={2}>
                  <Button
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
                  </Button>
                  <Button onClick={handleAddSection}>Add Section</Button>
                </Stack>
              </>
            )}
          </Box>
        </Stack>
      )}
    </Container>
  );
}
