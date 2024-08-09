'use client';

import {
  Box,
  Container,
  Fab,
  Grid,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Article, Quest, Section as SectionType } from '@/types/Unit';
import ArticleAside from '@/components/ArticleAside';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { arrayRemove, arrayUnion, doc, updateDoc } from '@firebase/firestore';
import db, { storage } from '@/utils/firebase';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from '@firebase/storage';
import { generateUUID } from '@/utils/uuid';
import { useUser } from '@/hooks/useUser';
import { useCampaign } from '@/hooks/useCampaign';
import ImageList from '@/components/ImageList';

const Section = (props: { section: SectionType }) => {
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
const EditableSection = (props: { section: SectionType }) => {
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

export const PageContent = () => {
  const [content, setContent] = useState<Article | Quest | null>(null);
  const [isEditing, setEditing] = useState<boolean>(false);
  const [isAdding, setAdding] = useState<boolean>(false);
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);

  const sectionsFormRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useUser();
  const { campaign, currentUnit } = useCampaign();

  const [anchor, setAnchor] = useState(null);
  const addMenuOpen = Boolean(anchor);

  useEffect(() => {
    if (currentUnit?.type === 'article') {
      setContent(currentUnit as Article);
    } else if (currentUnit?.type === 'quest') {
      setContent(currentUnit as Quest);
    }
  }, [currentUnit]);

  const handleClickAddMenu = (event: any) => {
    setAnchor(event.currentTarget);
  };

  const handleCloseAddMenu = () => {
    setAnchor(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (content) {
      const formData = new FormData(event.currentTarget);
      const sectionsData = content.sections
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
            } as SectionType;
          }
          return null;
        })
        .filter((section): section is SectionType => section !== null);

      const newArticle = {
        ...content,
        sections: sectionsData,
      };
      setContent(newArticle);
      isEditing && setEditing(false);
      isAdding && setAdding(false);

      await updateDoc(doc(db, 'units', content.id), {
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

  const handleDeleteImage = async (index: number) => {
    if (content) {
      const imageUrl = content.imageUrls[index];
      const newArticle = {
        ...content,
        imageUrls: content.imageUrls.filter((url) => url !== imageUrl),
      };
      setContent(newArticle);

      await updateDoc(doc(db, 'units', content.id), {
        imageUrls: arrayRemove(imageUrl),
      });
      await deleteObject(ref(storage, imageUrl));
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (content && campaign) {
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
          await updateDoc(doc(db, 'units', content.id), {
            imageUrls: arrayUnion(fileUrl),
          });
        }
      }
    }
  };

  const handleAddSection = () => {
    if (content && user) {
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
        ...content,
        sections: [...content.sections, newSection],
      };
      setContent(newArticle);
    }
  };

  const handleDeleteSection = () => {
    if (content) {
      const newArticle = {
        ...content,
        sections: [...content.sections].filter(
          (a) => a.id !== focusedSectionId
        ),
      };
      setFocusedSectionId(null);
      setContent(newArticle);
    }
  };

  return (
    <Container sx={{ paddingY: 3 }}>
      {content && (
        <Grid container spacing={3}>
          <Grid item xs={3}>
            <Box width={'100%'}>
              <ArticleAside article={content} />
            </Box>
          </Grid>
          <Grid item xs={8}>
            <Box pl={3}>
              {content.hidden && (
                <Typography color={'grey'} variant={'subtitle2'}>
                  Hidden from players
                </Typography>
              )}
              <form ref={sectionsFormRef} onSubmit={handleSave}>
                {content.sections.map((section, index) => (
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
              {content.imageUrls.length > 0 && (
                <ImageList
                  imageUrls={content.imageUrls}
                  handleDeleteImage={handleDeleteImage}
                />
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
            <CheckIcon />
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
          <DeleteIcon />
        </Fab>
      </Stack>
    </Container>
  );
};
