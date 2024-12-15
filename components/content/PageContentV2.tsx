'use client';

import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Divider,
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
import { getCurrentUnitIdFromUrl } from '@/utils/url';
import { usePathname } from 'next/navigation';
import { createEditor } from 'slate';
import { Editable, Slate, withReact } from 'slate-react';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import { outfit } from '@/components/AppWrapper';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';

const Section = (props: {
  section: SectionType;
  author: UserBase | null;
  setUnsavedChanges: Function;
  handleHideSection: Function;
}) => {
  const { isUserDm } = useCampaign();
  const [displayHideButton, setDisplayHideButton] = useState(
    props.section.hidden
  );
  const [editor] = useState(() => withReact(createEditor()));

  // TODO: Allow saving for titles
  return (
    <>
      <TextField
        name={`title-${props.section.id}`}
        defaultValue={props.section.title}
        placeholder="Section Title"
        sx={{
          '& .MuiInputBase-input': {
            fontSize: props.section.isHeader ? '4rem' : '2rem',
            fontWeight: BOLD_FONT_WEIGHT,
            p: 0,
            fontFamily: outfit.style.fontFamily,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
        }}
        fullWidth
      />
      <Slate
        editor={editor}
        initialValue={props.section.body}
        onChange={(value) => {
          const editorContainer = document.getElementById(
            `body-${props.section.id}`
          );
          if (editorContainer) {
            editorContainer.dataset.value = JSON.stringify(value);
          }
          const isAstChange = editor.operations.some(
            (op) => 'set_selection' !== op.type
          );
          if (isAstChange) {
            props.setUnsavedChanges(true);
          }
        }}
      >
        <Box
          id={`body-${props.section.id}`}
          data-value={JSON.stringify(props.section.body)}
        >
          <Editable placeholder={'Section body'} />
        </Box>
      </Slate>
    </>
  );

  // TODO: Move hide section button to bottom right (?)
  // return (
  //   <Stack
  //     direction={'row'}
  //     onMouseEnter={() => !props.section.hidden && setDisplayHideButton(true)}
  //     onMouseLeave={() => !props.section.hidden && setDisplayHideButton(false)}
  //   >
  //     <Box flexGrow={1}>
  //       <Typography
  //         fontWeight={BOLD_FONT_WEIGHT}
  //         variant={props.section.isHeader ? 'h2' : 'h4'}
  //         sx={{
  //           fontFamily: outfit.style.fontFamily,
  //         }}
  //       >
  //         {props.section.title}
  //       </Typography>
  //       <Typography
  //         sx={{
  //           whiteSpace: 'pre-line',
  //           fontFamily: outfit.style.fontFamily,
  //         }}
  //       >
  //         {props.section.body}
  //       </Typography>
  //     </Box>
  //     {isUserDm && !props.section.isHeader && (
  //       <Tooltip
  //         title={props.section.hidden ? 'Hidden from players' : 'Hide Section'}
  //       >
  //         <Fade in={displayHideButton}>
  //           <IconButton
  //             onClick={() => props.handleHideSection(props.section.id)}
  //             sx={{ height: 32 }}
  //           >
  //             <VisibilityOffIcon sx={{ color: 'grey' }} />
  //           </IconButton>
  //         </Fade>
  //       </Tooltip>
  //     )}
  //   </Stack>
  // );
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

// TODO: Add snackbars for adding, saving, and deleting sections
export const PageContentV2 = () => {
  const [content, setContent] = useState<Article | Quest | null>(null);
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
  const [isUnsavedChanges, setUnsavedChanges] = useState(false);

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
      if (event.key === 'Tab') {
        const focusedSectionIndex =
          content?.sections.findIndex(
            (section) => section.id === focusedSectionId
          ) ?? null;
        // TODO: I broke this
        focusedSectionIndex && handleAddSection(focusedSectionIndex);
      }
      // TODO: I broke these too
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
        const sectionsData = content.sections.map((section) => {
          const title = formData.get(`title-${section.id}`) as string;

          const editorContent = document.getElementById(`body-${section.id}`)
            ?.dataset?.value;

          if (title.trim() && editorContent) {
            return {
              id: section.id,
              isHeader: section.isHeader || false,
              authorId: section.authorId || '',
              title,
              body: JSON.parse(editorContent),
            } as SectionType;
          }

          return null;
        });

        const isHidden = !!formData.get('isHidden');

        const newArticle = {
          ...content,
          sections: sectionsData,
          hidden: isHidden,
        };
        setContent(newArticle);
        setFocusedSectionId(null);
        setUnsavedChanges(false);

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
        body: [
          {
            type: 'paragraph',
            children: [{ text: '' }],
          },
        ],
        isHeader: false,
        authorId: user.id,
      } as SectionType;

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
      setContent(newArticle);
    }
  };

  const handleHideSection = async (sectionId: string) => {
    if (content) {
      const sectionIndex =
        content?.sections.findIndex((section) => section.id === sectionId) ??
        null;
      const newSections = [
        ...content.sections.slice(0, sectionIndex),
        {
          ...content.sections[sectionIndex],
          hidden: !content.sections[sectionIndex].hidden,
        },
        ...content.sections.slice(sectionIndex + 1),
      ];
      await updateDoc(doc(db, 'units', content.id), {
        sections: newSections,
      });
    }
  };

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
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Box pl={3}>
                  <form ref={sectionsFormRef} onSubmit={handleSave}>
                    {/*<Box*/}
                    {/*  sx={{*/}
                    {/*    marginTop: -4,*/}
                    {/*  }}*/}
                    {/*>*/}
                    {/*  {isUserDm && (*/}
                    {/*    <HideContentCheckbox defaultValue={content.hidden} />*/}
                    {/*  )}*/}
                    {/*</Box>*/}
                    {content.sections.map((section, index) => {
                      const author =
                        campaign?.players.find(
                          (player) => player.id === section.authorId
                        ) ?? null;
                      return (
                        <Box
                          key={section.id}
                          sx={{
                            paddingBottom: '28px',
                            display:
                              !section.hidden || isUserDm ? 'auto' : 'none',
                          }}
                          onClick={() => {
                            if (!section.isHeader) {
                              setFocusedSectionId(section.id);
                            }
                          }}
                        >
                          {/* Section title page anchor */}
                          <span
                            id={section.title}
                            style={{
                              position: 'relative',
                              top: -90,
                            }}
                          ></span>
                          <Section
                            section={section}
                            author={author}
                            setUnsavedChanges={setUnsavedChanges}
                            handleHideSection={handleHideSection}
                          />
                          {section.isHeader && <Divider sx={{ p: 1 }} />}
                        </Box>
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
            <>
              <Tooltip title={'Save Changes'} placement={'left'}>
                <span>
                  <IconButton
                    size="large"
                    disabled={!isUnsavedChanges}
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
                </span>
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
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};
