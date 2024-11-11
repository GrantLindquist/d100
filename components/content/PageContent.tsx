'use client';

import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Fade,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Article, Quest, Section as SectionType } from '@/types/Unit';
import ArticleAside from '@/components/content/ArticleAside';
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
import ImageList from '@/components/content/ImageList';
import LootTable from '@/components/content/LootTable';
import AddIcon from '@mui/icons-material/Add';
import { useAlert } from '@/hooks/useAlert';
import { UserBase } from '@/types/User';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';

// TODO: Fix warning: "" was passed as src prop
const Section = (props: { section: SectionType; author: UserBase | null }) => {
  const [displayAuthor, setDisplayAuthor] = useState(false);
  return (
    <Stack
      direction={'row'}
      onMouseEnter={() => setDisplayAuthor(true)}
      onMouseLeave={() => setDisplayAuthor(false)}
    >
      <Stack spacing={2} flexGrow={1}>
        <Typography
          fontWeight={BOLD_FONT_WEIGHT}
          variant={props.section.isHeader ? 'h2' : 'h4'}
        >
          {props.section.title}
        </Typography>
        <Typography
          sx={{
            whiteSpace: 'pre-line',
          }}
        >
          {props.section.body}
        </Typography>
      </Stack>
      {props.author?.photoURL && (
        <Tooltip title={`Author: ${props.author.displayName}`}>
          <Fade in={displayAuthor}>
            <Avatar
              src={props.author.photoURL}
              alt={props.author.displayName ?? 'Player'}
              sx={{
                marginTop: 1,
                width: 30,
                height: 30,
              }}
            />
          </Fade>
        </Tooltip>
      )}
    </Stack>
  );
};

const EditableSection = (props: {
  section: SectionType;
  author: UserBase | null;
}) => {
  return (
    <Stack spacing={2}>
      <TextField
        name={`title-${props.section.id}`}
        defaultValue={props.section.title}
        placeholder="Section Title"
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
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);

  const sectionsFormRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useUser();
  const { campaign, currentUnit } = useCampaign();
  const { displayAlert } = useAlert();

  useEffect(() => {
    if (currentUnit?.type === 'article') {
      setContent(currentUnit as Article);
    } else if (currentUnit?.type === 'quest') {
      setContent(currentUnit as Quest);
    }
  }, [currentUnit]);

  const focusedSectionTitle =
    content?.sections.find((section) => section.id == focusedSectionId)
      ?.title ?? 'Section';

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (content) {
      try {
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
        setFocusedSectionId(null);
        isEditing && setEditing(false);

        await updateDoc(doc(db, 'units', content.id), {
          sections: sectionsData,
        });
      } catch (e: any) {
        displayAlert({
          message: 'An error occurred while saving the article.',
          isError: true,
          errorType: e.name,
        });
      }
    }
  };

  const handleAddImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDeleteImage = async (index: number) => {
    if (content) {
      try {
        const imageUrl = content.imageUrls[index];
        setContent({
          ...content,
          imageUrls: content.imageUrls.filter((url) => url !== imageUrl),
        });

        await updateDoc(doc(db, 'units', content.id), {
          imageUrls: arrayRemove(imageUrl),
        });
        await deleteObject(ref(storage, imageUrl));
      } catch (e: any) {
        displayAlert({
          message: 'An error occurred while deleting the image.',
          isError: true,
          errorType: e.name,
        });
      }
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (content && campaign) {
      try {
        let urls = [...content.imageUrls];
        const files = event.target.files ?? [];
        for (let file of files) {
          const imageId = content.id + '-' + generateUUID();
          const imageRef = ref(storage, `${campaign.id}/${imageId}`);
          await uploadBytes(imageRef, file);
          const fileUrl = await getDownloadURL(imageRef);
          urls.push(fileUrl);
          await updateDoc(doc(db, 'units', content.id), {
            imageUrls: arrayUnion(fileUrl),
          });
        }
        setContent({
          ...content,
          imageUrls: urls,
        });
      } catch (e: any) {
        displayAlert({
          message: 'An error occurred while uploading files.',
          isError: true,
          errorType: e.name,
        });
      }
    }
  };

  const handleAddSection = () => {
    if (content && user) {
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

  // TODO: Data mismatch between content state and firebase -- also switches between isEditing change
  const handleDeleteSection = async () => {
    if (content) {
      try {
        const newSections = [...content.sections].filter(
          (a) => a.id !== focusedSectionId
        );
        const newArticle = {
          ...content,
          sections: newSections,
        };
        await updateDoc(doc(db, 'units', content.id), {
          sections: newSections,
        });
        setContent(newArticle);
        setFocusedSectionId(null);
        setEditing(false);
      } catch (e: any) {
        displayAlert({
          message: 'An error occurred while deleting the section.',
          isError: true,
          errorType: e.name,
        });
      }
    }
  };

  return (
    <Container>
      <Box
        sx={{
          pt: 12,
        }}
      >
        {content && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box
                sx={{
                  position: { sm: 'auto', md: 'fixed' },
                  width: { xs: '100%', md: '23vw', lg: '19vw' },
                  px: { xs: 3, md: 0 },
                }}
              >
                <ArticleAside article={content} />
                {isEditing && (
                  <Box py={1}>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddSection}
                      sx={{ color: 'grey' }}
                    >
                      Add Section
                    </Button>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddImage}
                      sx={{ color: 'grey' }}
                    >
                      Add Reference Image
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box pl={3}>
                {content.hidden && (
                  <Typography color={'grey'} variant={'subtitle2'}>
                    Hidden from players
                  </Typography>
                )}
                <form ref={sectionsFormRef} onSubmit={handleSave}>
                  {content.sections.map((section, index) => {
                    const author =
                      campaign?.players.find(
                        (player) => player.id === section.authorId
                      ) ?? null;
                    return (
                      <div key={index} style={{ paddingBottom: '28px' }}>
                        {/* Section title page anchor */}
                        <span
                          id={section.title}
                          style={{
                            position: 'relative',
                            top: -90,
                          }}
                        ></span>
                        <Box
                          onClick={() => {
                            if (!section.isHeader) {
                              setFocusedSectionId(section.id);
                            }
                          }}
                          sx={
                            isEditing ||
                            (section.title.length <= 0 &&
                              section.body.length <= 0)
                              ? {}
                              : { display: 'none' }
                          }
                        >
                          <EditableSection section={section} author={author} />
                        </Box>
                        <Box sx={!isEditing ? {} : { display: 'none' }}>
                          <Section section={section} author={author} />
                        </Box>
                        {section.isHeader && (
                          <Divider
                            sx={
                              section.body.trim() || isEditing ? { py: 1 } : {}
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </form>
                {content.type === 'quest' && (
                  <>
                    {/*<QuestTimeline questId={content.id} />*/}
                    <div style={{ paddingBottom: '28px' }}>
                      <LootTable questId={content.id} />
                    </div>
                  </>
                )}
                {content.imageUrls.length > 0 && (
                  <div style={{ paddingBottom: '28px' }}>
                    <ImageList
                      imageUrls={content.imageUrls}
                      handleDeleteImage={handleDeleteImage}
                    />
                  </div>
                )}
              </Box>
            </Grid>
          </Grid>
        )}
        <Stack
          direction="column"
          p={3}
          sx={{
            position: 'fixed',
            right: 16,
            bottom: 16,
          }}
        >
          {isEditing ? (
            <>
              <Tooltip title={'Save Changes'} placement={'left'}>
                <IconButton
                  size="large"
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
                </IconButton>
              </Tooltip>
              <Tooltip
                title={`Delete ${focusedSectionTitle}`}
                placement={'left'}
              >
                <span>
                  <IconButton
                    size="large"
                    disabled={!Boolean(focusedSectionId)}
                    onClick={handleDeleteSection}
                  >
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          ) : (
            <Tooltip title={'Edit Page'} placement={'left'}>
              <IconButton size="large" onClick={() => setEditing(true)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>
      {/*<Button onClick={() => console.log(content)}>log state</Button>*/}
    </Container>
  );
};
