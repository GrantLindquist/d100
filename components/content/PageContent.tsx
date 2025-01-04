'use client';

import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Article, Breadcrumb, ImageUrl, Quest } from '@/types/Unit';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
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
import { useCampaign } from '@/hooks/useCampaign';
import ImageList from '@/components/content/ImageList';
import LootTable from '@/components/content/LootTable';
import AddIcon from '@mui/icons-material/Add';
import { useAlert } from '@/hooks/useAlert';
import { getCurrentUnitIdFromUrl } from '@/utils/url';
import { usePathname } from 'next/navigation';
import CheckIcon from '@mui/icons-material/Check';
import ArticleAside from '@/components/content/ArticleAside';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { BubbleMenu, EditorContent, useEditor } from '@tiptap/react';
import Bulletlist from '@tiptap/extension-bullet-list';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import ListItem from '@tiptap/extension-list-item';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import History from '@tiptap/extension-history';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import { Typography as TypographyExtension } from '@tiptap/extension-typography';
import { HiddenMark } from '@/components/content/text-editor/CustomMarks';
import Link from '@tiptap/extension-link';
import '@/components/content/text-editor/EditorContent.css';
import EnforceTitle from '@/components/content/text-editor/EnforceTitle';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import TitleIcon from '@mui/icons-material/Title';

// TODO: Make drag/hover event work when initiated outside of editor
export const PageContent = () => {
  const [unit, setUnit] = useState<Article | Quest | null>(null);
  const [isUnsavedChanges, setUnsavedChanges] = useState(false);
  const [sectionTitles, setSectionTitles] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { campaign, setBreadcrumbs } = useCampaign();
  const { displayAlert } = useAlert();
  const pathname = usePathname();
  const theme = useTheme();

  useEffect(() => {
    if (editor && unit?.content) {
      editor.commands.setContent(unit.content);
    }

    const generateTitles = () => {
      const titles = [];
      const titleNodes =
        editor?.getJSON().content?.filter((c) => c.type === 'heading') ?? [];
      for (const node of titleNodes) {
        if (node?.content?.[0].text) {
          titles.push(node.content[0].text);
        }
      }
      return titles;
    };
    setSectionTitles(generateTitles());
  }, [unit]);

  useEffect(() => {
    const url = pathname.split('/').slice(1);
    const unitId = getCurrentUnitIdFromUrl(url);
    if (unitId) {
      const unsubscribe = onSnapshot(
        doc(db, 'units', unitId),
        (unitDocSnap) => {
          if (unitDocSnap.exists()) {
            setUnit(unitDocSnap.data() as Article | Quest);
            setBreadcrumbs(unitDocSnap.data().breadcrumbs as Breadcrumb[]);
          }
        }
      );
      return () => {
        unsubscribe();
      };
    }
  }, []);

  // TODO: Optimize rendering https://tiptap.dev/docs/examples/advanced/react-performance
  const editor = useEditor({
    extensions: [
      Bulletlist,
      Document,
      HardBreak,
      Heading.configure({
        levels: [2],
      }),
      ListItem,
      Paragraph,
      Text,
      History,
      Bold,
      TypographyExtension,
      Italic,
      HiddenMark,
      EnforceTitle,
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
    ],
    immediatelyRender: false,
    content: '',
    // TODO: Maximum call stack exceeded - try to enforce this as single-line
    onUpdate: ({ editor }) => {
      setUnsavedChanges(true);
    },
  });

  const handleSaveContent = async () => {
    if (unit && editor) {
      try {
        const unitTitle =
          editor.getJSON().content?.[0]?.content?.[0]?.text ?? unit?.title;
        await updateDoc(doc(db, 'units', unit.id), {
          content: editor.getJSON(),
          title: unitTitle,
        });
        displayAlert({
          message: `Your changes to ${unitTitle} have been saved.`,
        });
      } catch (e: any) {
        displayAlert({
          message: 'An error occurred while saving changes.',
          isError: true,
          errorType: e.message,
        });
      }
    }
    setUnsavedChanges(false);
  };

  const handleAddImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDeleteImage = async (index: number) => {
    if (unit) {
      try {
        const imageUrl = unit.imageUrls[index];
        setUnit({
          ...unit,
          imageUrls: unit.imageUrls.filter((url) => url !== imageUrl),
        });

        await updateDoc(doc(db, 'units', unit.id), {
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

  console.log(editor?.getJSON());

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (unit && campaign) {
      try {
        let urls = [...unit.imageUrls];
        const files = event.target.files ?? [];
        for (let file of files) {
          const img = new Image();
          img.src = URL.createObjectURL(file);
          img.onload = async () => {
            const ratio = img.naturalWidth / img.naturalHeight;
            const imageId = unit.id + '-' + generateUUID();
            const imageRef = ref(storage, `${campaign.id}/${imageId}`);
            await uploadBytes(imageRef, file);
            const fileUrl = await getDownloadURL(imageRef);
            const imageUrl: ImageUrl = {
              src: fileUrl,
              ratio: ratio,
            };
            urls.push(imageUrl);
            await updateDoc(doc(db, 'units', unit.id), {
              imageUrls: arrayUnion(imageUrl),
            });
          };
        }
        setUnit({
          ...unit,
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

  const toggleHideUnit = async (toggle: boolean) => {
    try {
      if (unit) {
        if (isUnsavedChanges) {
          await handleSaveContent();
        }
        await updateDoc(doc(db, 'units', unit.id), {
          hidden: toggle,
        });
        displayAlert({
          message: `Content is ${toggle ? 'now' : 'no longer'} hidden from players.`,
        });
      }
    } catch (e: any) {
      displayAlert({
        message: `An error occurred while hiding this content.`,
        isError: true,
        errorType: e.message,
      });
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
          {unit && (
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
                    <ArticleAside titles={sectionTitles} article={unit} />
                  </Box>

                  <Box py={1}>
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
                <Box pl={3} zIndex={5}>
                  <Typography
                    sx={{ userSelect: 'none' }}
                    pb={1}
                    mt={-4}
                    color={'grey'}
                  >
                    {unit.hidden && 'Hidden from players'}&nbsp;
                    {isUnsavedChanges && <em>(unsaved changes)</em>}
                  </Typography>

                  {editor && (
                    <BubbleMenu
                      editor={editor}
                      tippyOptions={{ duration: 100 }}
                    >
                      <Box
                        sx={{
                          backgroundColor: '#222222',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <FormatBoldIcon
                          onClick={() =>
                            editor.chain().focus().toggleBold().run()
                          }
                          sx={{
                            margin: 0.75,
                            cursor: 'pointer',
                            color: editor.isActive('bold')
                              ? theme.palette.primary.main
                              : 'grey',
                          }}
                        />
                        <FormatItalicIcon
                          onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                          }
                          sx={{
                            margin: 0.75,
                            cursor: 'pointer',
                            color: editor.isActive('italic')
                              ? theme.palette.primary.main
                              : 'grey',
                          }}
                        />
                        <TitleIcon
                          onClick={() =>
                            editor
                              .chain()
                              .focus()
                              .toggleHeading({
                                level: 2,
                              })
                              .run()
                          }
                          sx={{
                            margin: 0.75,
                            cursor: 'pointer',
                            color: editor.isActive('heading')
                              ? theme.palette.primary.main
                              : 'grey',
                          }}
                        />
                        <Tooltip title={'Hide from players'} placement={'top'}>
                          <VisibilityOffIcon
                            onClick={() =>
                              // @ts-ignore
                              editor.chain().focus().toggleHidden().run()
                            }
                            sx={{
                              width: 22,
                              height: 22,
                              margin: 0.75,
                              cursor: 'pointer',
                              color: editor.isActive('hidden')
                                ? theme.palette.primary.main
                                : 'grey',
                            }}
                          />
                        </Tooltip>
                      </Box>
                    </BubbleMenu>
                  )}
                  <EditorContent editor={editor} />

                  {unit.type === 'quest' && (
                    <>
                      {/*<QuestTimeline questId={content.id} />*/}
                      <div style={{ paddingBottom: '28px' }}>
                        <LootTable questId={unit.id} />
                      </div>
                    </>
                  )}
                  {unit.imageUrls.length > 0 && (
                    <div style={{ paddingBottom: '28px' }}>
                      <ImageList
                        imageUrls={unit.imageUrls}
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
            <Tooltip title={`Hide Content From Players`} placement={'left'}>
              <span>
                <IconButton
                  size="large"
                  onClick={() => toggleHideUnit(!unit?.hidden)}
                >
                  <VisibilityOffIcon
                    style={!unit?.hidden ? { color: 'grey' } : {}}
                  />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={'Save Changes'} placement={'left'}>
              <span>
                <IconButton
                  size="large"
                  disabled={!isUnsavedChanges}
                  onClick={handleSaveContent}
                >
                  <CheckIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};
