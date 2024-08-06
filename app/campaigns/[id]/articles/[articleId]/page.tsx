'use client';

import {
  Backdrop,
  Box,
  Container,
  Fab,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Article, Section } from '@/types/Unit';
import { arrayUnion, doc, getDoc, updateDoc } from '@firebase/firestore';
import db, { storage } from '@/utils/firebase';
import { generateUUID } from '@/utils/uuid';
import { useUser } from '@/hooks/useUser';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ArticleAside from '@/components/ArticleAside';
import Masonry from '@mui/lab/Masonry';
import { getDownloadURL, ref, uploadBytes } from '@firebase/storage';
import { useCampaign } from '@/hooks/useCampaign';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DeleteIcon from '@mui/icons-material/Delete';

// TODO: This file is bloated
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useUser();
  const { campaign } = useCampaign();

  const [anchor, setAnchor] = useState(null);
  const addMenuOpen = Boolean(anchor);

  const [backdropIndex, setBackdropIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      const articleDocSnap = await getDoc(doc(db, 'units', params.articleId));
      if (articleDocSnap.exists()) {
        setArticle(articleDocSnap.data() as Article);
      }
    };
    fetchArticle();
  }, [params.articleId]);

  const handleClickAddMenu = (event: any) => {
    setAnchor(event.currentTarget);
  };

  const handleCloseAddMenu = () => {
    setAnchor(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (article) {
      const formData = new FormData(event.currentTarget);
      const sectionsData = article.sections
        .map((section) => {
          const title = formData.get(`title-${section.id}`) as string;
          const body = formData.get(`body-${section.id}`) as string;

          if (title.trim()) {
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

      await updateDoc(doc(db, 'units', params.articleId), {
        sections: sectionsData,
      });
    }
  };

  const handleAddImage = () => {
    handleCloseAddMenu();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDeleteImage = () => {};

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (article && campaign) {
      const files = event.target.files;
      if (files) {
        for (let file of files) {
          const imageId = file.name + '-' + generateUUID();
          const imageRef = ref(
            storage,
            `${campaign.title}-${campaign.id}/${imageId}`
          );
          await uploadBytes(imageRef, file);
          const fileUrl = await getDownloadURL(imageRef);
          await updateDoc(doc(db, 'units', article.id), {
            imageUrls: arrayUnion(fileUrl),
          });
        }
      }
    }
  };

  const changeBackdrop = (difference: -1 | 1) => {
    if (article && backdropIndex !== null) {
      const imageUrlCount = article.imageUrls.length;
      if (backdropIndex <= 0 && difference === -1) {
        setBackdropIndex(imageUrlCount - 1);
      } else if (backdropIndex >= imageUrlCount) {
        setBackdropIndex(0);
      } else {
        setBackdropIndex(backdropIndex + difference);
      }
    }
  };

  const handleAddSection = () => {
    if (article && user) {
      handleCloseAddMenu();
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
      <Stack spacing={2} id={props.section.title}>
        <Typography variant={props.section.isHeader ? 'h2' : 'h4'}>
          {props.section.title}
        </Typography>
        <Typography>{props.section.body}</Typography>
      </Stack>
    );
  };

  // TODO: Figure out how to have my cake (onFocus id state) and eat it too (one click to access TextField)
  const EditableSection = (props: { section: Section }) => {
    return (
      <Stack spacing={2}>
        <TextField
          name={`title-${props.section.id}`}
          defaultValue={props.section.title}
          placeholder="Section Title"
          // onFocus={() => setFocusedSectionId(props.section.id)}
          sx={{
            '& .MuiInputBase-input': {
              fontSize: props.section.isHeader ? '4rem' : '2rem',
              fontStyle: 'italic',
              p: 0,
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
              p: 0,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
          }}
          multiline
          fullWidth
        />
      </Stack>
    );
  };

  return (
    <Container sx={{ paddingY: 3 }}>
      {article && (
        <Grid container spacing={3}>
          <Grid item xs={3}>
            <Box width={'100%'}>
              <ArticleAside article={article} />
            </Box>
            {/*<Breadcrumbs aria-label="breadcrumb">*/}
            {/*  <Link href="/">MUI</Link>*/}
            {/*  <Link href="/material-ui/getting-started/installation/">*/}
            {/*    Core*/}
            {/*  </Link>*/}
            {/*  <Typography>Breadcrumbs</Typography>*/}
            {/*</Breadcrumbs>*/}
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
              {article.imageUrls.length > 0 && (
                <>
                  <Typography variant={'h4'}>Reference Images</Typography>
                  <Masonry spacing={1}>
                    {article.imageUrls.map((url, index) => {
                      return (
                        <img
                          key={index}
                          alt={`Reference Image #${index}`}
                          src={url}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setBackdropIndex(index)}
                        />
                      );
                    })}
                  </Masonry>
                </>
              )}
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
        <Fab size="small" onClick={handleClickAddMenu}>
          <AddIcon />
        </Fab>
        <Menu anchorEl={anchor} open={addMenuOpen} onClose={handleCloseAddMenu}>
          <MenuItem onClick={handleAddSection}>Add Section</MenuItem>
          <MenuItem onClick={handleAddImage}>Add Reference Images</MenuItem>
        </Menu>
        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        {(isEditing || isAdding) && (
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
        )}
        {!isEditing && (
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
      <Backdrop
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={backdropIndex !== null}
        onClick={() => setBackdropIndex(null)}
      >
        <Box
          sx={{ height: '65%' }}
          onClick={(event) => event.stopPropagation()}
        >
          <img
            style={{ height: '100%' }}
            src={
              article && backdropIndex !== null
                ? article.imageUrls[backdropIndex]
                : ''
            }
            alt={'Resized Reference Image'}
          />
          {/* TODO: Change UI to not resize w/ image width */}
          <Stack direction={'row'}>
            <IconButton onClick={() => changeBackdrop(-1)}>
              <KeyboardArrowLeftIcon />
            </IconButton>
            <IconButton onClick={() => changeBackdrop(1)}>
              <KeyboardArrowRightIcon />
            </IconButton>
            <IconButton onClick={handleDeleteImage}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        </Box>
      </Backdrop>
    </Container>
  );
}
