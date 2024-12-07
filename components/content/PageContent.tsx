'use client';

import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
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
import {
  Article,
  Breadcrumb,
  ImageUrl,
  Quest,
  Section as SectionType,
} from '@/types/Unit';
import ArticleAside from '@/components/content/ArticleAside';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import {
  arrayRemove,
  arrayUnion,
  doc,
  onSnapshot,
  updateDoc,
} from '@firebase/firestore';
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
import { getCurrentUnitIdFromUrl } from '@/utils/url';
import { usePathname } from 'next/navigation';

// TODO: Add option to hide individual sections
const Section = (props: { section: SectionType; author: UserBase | null }) => {
  const [displayAuthor, setDisplayAuthor] = useState(false);
  return (
    <Stack
      direction={'row'}
      onMouseEnter={() => setDisplayAuthor(true)}
      onMouseLeave={() => setDisplayAuthor(false)}
    >
      <Box flexGrow={1}>
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
      </Box>
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

// TODO: When editing, the sections scroll above navbar
const EditableSection = (props: {
  section: SectionType;
  author: UserBase | null;
}) => {
  return (
    <>
      <TextField
        name={`title-${props.section.id}`}
        defaultValue={props.section.title}
        placeholder="Section Title"
        sx={{
          '& .MuiInputBase-input': {
            fontSize: props.section.isHeader ? '4rem' : '2rem',
            fontStyle: 'italic',
            fontWeight: BOLD_FONT_WEIGHT,
            p: 0,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
        }}
        fullWidth
      />
      <div data-section-id={props.section.id}>
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
      </div>
    </>
  );
};

const HideContentCheckbox = (props: { defaultValue: boolean }) => {
  const [checked, setChecked] = useState(props.defaultValue);

  return (
    <Stack direction={'row'} alignItems={'center'}>
      <Checkbox
        sx={{
          paddingY: 0,
          paddingLeft: 0,
          paddingRight: 1,
        }}
        name={'isHidden'}
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
      />
      <Typography color={'grey'} variant={'subtitle2'}>
        Hidden from players
      </Typography>
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
  const { campaign, isUserDm, setBreadcrumbs } = useCampaign();
  const { displayAlert } = useAlert();
  const pathname = usePathname();

  useEffect(() => {
    const url = pathname.split('/').slice(1);
    const unitId = getCurrentUnitIdFromUrl(url);
    if (unitId) {
      const unsubscribe = onSnapshot(
        doc(db, 'units', unitId),
        (unitDocSnap) => {
          if (unitDocSnap.exists()) {
            setContent(unitDocSnap.data() as Article | Quest);
            setBreadcrumbs(unitDocSnap.data().breadcrumbs as Breadcrumb[]);
          }
        }
      );
      return () => {
        unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    const focusSection = (sectionId: string) => {
      setFocusedSectionId(sectionId);
      const element = document.querySelector(
        `[data-section-id="${sectionId}"]`
      );
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const inputElement = element?.querySelector('input, textarea');
      // @ts-ignore
      inputElement?.focus();
    };

    const handleKeyShortcut = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && isEditing) {
        const focusedSectionIndex =
          content?.sections.findIndex(
            (section) => section.id === focusedSectionId
          ) ?? null;
        focusedSectionIndex && handleAddSection(focusedSectionIndex);
      }
      if (content && focusedSectionId && event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = content.sections.findIndex(
          (section) => section.id === focusedSectionId
        );
        currentIndex > 0 && focusSection(content.sections[currentIndex - 1].id);
      }
      if (content && focusedSectionId && event.key === 'ArrowDown') {
        event.preventDefault();
        const currentIndex = content.sections.findIndex(
          (section) => section.id === focusedSectionId
        );

        currentIndex < content.sections.length - 1 &&
          focusSection(content.sections[currentIndex + 1].id);
      }
    };

    document.addEventListener('keydown', handleKeyShortcut);

    return () => {
      document.removeEventListener('keydown', handleKeyShortcut);
    };
  }, [content, focusedSectionId]);

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

        const isHidden = !!formData.get('isHidden');

        const newArticle = {
          ...content,
          sections: sectionsData,
          hidden: isHidden,
        };
        setContent(newArticle);
        setFocusedSectionId(null);
        isEditing && setEditing(false);

        await updateDoc(doc(db, 'units', content.id), {
          sections: sectionsData,
          hidden: isHidden,
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
        await deleteObject(ref(storage, imageUrl.src));
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
          const img = new Image();
          img.src = URL.createObjectURL(file);
          img.onload = async () => {
            const ratio = img.naturalWidth / img.naturalHeight;
            const imageId = content.id + '-' + generateUUID();
            const imageRef = ref(storage, `${campaign.id}/${imageId}`);
            await uploadBytes(imageRef, file);
            const fileUrl = await getDownloadURL(imageRef);
            const imageUrl: ImageUrl = {
              src: fileUrl,
              ratio: ratio,
            };
            urls.push(imageUrl);
            await updateDoc(doc(db, 'units', content.id), {
              imageUrls: arrayUnion(imageUrl),
            });
          };
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

  const handleAddSection = (index?: number) => {
    if (content && user) {
      const newSection = {
        id: generateUUID(),
        title: '',
        body: '',
        isHeader: false,
        authorId: user.id,
      };

      const newArticle =
        index !== undefined
          ? {
              ...content,
              sections: [
                ...content.sections.slice(0, index + 1),
                newSection,
                ...content.sections.slice(index + 1),
              ],
            }
          : {
              ...content,
              sections: [...content.sections, newSection],
            };
      console.log(newArticle);
      setContent(newArticle);
    }
  };

  /*
   * TODO: Data mismatch between content state and firebase -- also switches between isEditing change
   *  NOTE: this **MAY** be caused by the fact that section is not "focused" on unless title is clicked.
   *  clicking on body does not focus section
   */
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
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#111111',
      }}
    >
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
                    position: { xs: 'auto', md: 'fixed' },
                    width: { md: '23vw', lg: '19vw' },
                  }}
                >
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'block' },
                    }}
                  >
                    <ArticleAside article={content} />
                  </Box>
                  {isEditing && (
                    <Box py={1}>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={() => handleAddSection()}
                        sx={{ color: 'grey' }}
                      >
                        Add Section&nbsp;&nbsp;
                        <Chip
                          label={'TAB'}
                          variant={'outlined'}
                          size={'small'}
                          sx={{ borderRadius: '3px' }}
                        />
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
                  <form ref={sectionsFormRef} onSubmit={handleSave}>
                    <Box
                      sx={{
                        marginTop: -4,
                      }}
                    >
                      {isEditing ? (
                        <>
                          {isUserDm && (
                            <HideContentCheckbox
                              defaultValue={content.hidden}
                            />
                          )}
                        </>
                      ) : (
                        <Typography
                          color={'grey'}
                          variant={'subtitle2'}
                          sx={{
                            opacity: content.hidden ? 1 : 0,
                          }}
                        >
                          Hidden from players
                        </Typography>
                      )}
                    </Box>
                    {content.sections.map((section, index) => {
                      const author =
                        campaign?.players.find(
                          (player) => player.id === section.authorId
                        ) ?? null;
                      return (
                        <div key={section.id} style={{ paddingBottom: '28px' }}>
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
                            <EditableSection
                              section={section}
                              author={author}
                            />
                          </Box>
                          <Box sx={!isEditing ? {} : { display: 'none' }}>
                            <Section section={section} author={author} />
                          </Box>
                          {section.isHeader && (
                            <Divider
                              sx={
                                section.body.trim() || isEditing
                                  ? { py: 1 }
                                  : {}
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
    </Box>
  );
};
