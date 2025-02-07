'use client';

import {
  Box,
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
import { useAlert } from '@/hooks/useAlert';
import { getCurrentUnitIdFromUrl } from '@/utils/url';
import { usePathname } from 'next/navigation';
import CheckIcon from '@mui/icons-material/Check';
import ArticleAside from '@/components/content/ArticleAside';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  BubbleMenu,
  EditorContent,
  useEditor,
  useEditorState,
} from '@tiptap/react';
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
import Blockquote from '@tiptap/extension-blockquote';
import { Typography as TypographyExtension } from '@tiptap/extension-typography';
import Link from '@tiptap/extension-link';
import '@/components/content/text-editor/EditorContent.css';
import EnforceTitle from '@/components/content/text-editor/EnforceTitle';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import TitleIcon from '@mui/icons-material/Title';
import Highlight from '@tiptap/extension-highlight';
import FileDropzone from '@/components/content/text-editor/FileDropzone';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import AddToContentButton from '@/components/buttons/AddToContentButton';

// Conditionally renders hidden (highlight) mark
export const PageContent = () => {
  const { isUserDm } = useCampaign();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#111111',
      }}
    >
      {isUserDm !== null && <ContentEditor displayHiddenMarks={isUserDm} />}
    </Box>
  );
};

export const ContentEditor = (props: { displayHiddenMarks: boolean }) => {
  const [unit, setUnit] = useState<Article | Quest | null>(null);
  const [sectionTitles, setSectionTitles] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isUnsavedChanges, setUnsavedChanges } = useUnsavedChanges();
  const { isUserDm, campaign, setBreadcrumbs } = useCampaign();
  const { displayAlert } = useAlert();
  const pathname = usePathname();
  const theme = useTheme();

  // TODO: Focus editor on create
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

  const editor = useEditor({
    extensions: [
      Blockquote,
      Bulletlist,
      Bold,
      Document,
      EnforceTitle,
      Highlight.configure({
        HTMLAttributes: !props.displayHiddenMarks
          ? {
              class: 'hidden',
            }
          : {},
      }),
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
      TypographyExtension,
    ],
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    content: '',
    onUpdate: () => {
      setUnsavedChanges(true);
    },
  });

  // TODO: Get this working
  const shouldDisplayPlaceholder = () => {
    return (
      !editor?.getJSON()?.content?.[1]?.content ||
      editor?.getJSON()?.content?.[1]?.content?.[0]?.text?.trim().length === 0
    );
  };

  const currentEditorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBlockquote: ctx.editor?.isActive('blockquote'),
      isBold: ctx.editor?.isActive('bold'),
      isItalic: ctx.editor?.isActive('italic'),
      isHeading: ctx.editor?.isActive('heading'),
      isHidden: ctx.editor?.isActive('highlight'),
    }),
    equalityFn: (prev, next) => {
      if (!next || shouldDisplayPlaceholder()) {
        return false;
      }
      return (
        prev.isBlockquote === next.isBlockquote &&
        prev.isBold === next.isBold &&
        prev.isItalic === next.isItalic &&
        prev.isHeading === next.isHeading &&
        prev.isHidden == next.isHidden
      );
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
          lastEdited: Date.now(),
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

  // console.log(editor?.getJSON().content);

  return (
    <>
      {unit && (
        <FileDropzone unitId={unit.id}>
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <Container>
            <Box
              sx={{
                pt: 12,
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Box
                    sx={{
                      position: { xs: 'auto', md: 'fixed' },
                      width: {
                        md: '23vw',
                        lg: '19vw',
                        xl: '14vw',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: { xs: 'none', md: 'block' },
                      }}
                    >
                      <ArticleAside titles={sectionTitles} article={unit} />
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
                    {editor && currentEditorState && (
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
                              color: currentEditorState.isBold
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
                              color: currentEditorState.isItalic
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
                              color: currentEditorState.isHeading
                                ? theme.palette.primary.main
                                : 'grey',
                            }}
                          />
                          <FormatQuoteIcon
                            onClick={() =>
                              editor.chain().focus().toggleBlockquote().run()
                            }
                            sx={{
                              margin: 0.75,
                              cursor: 'pointer',
                              color: currentEditorState.isBlockquote
                                ? theme.palette.primary.main
                                : 'grey',
                            }}
                          />
                          {isUserDm && (
                            <Tooltip
                              title={'Hide from players'}
                              placement={'top'}
                            >
                              <VisibilityOffIcon
                                onClick={() =>
                                  editor.chain().focus().toggleHighlight().run()
                                }
                                sx={{
                                  width: 22,
                                  height: 22,
                                  margin: 0.75,
                                  cursor: 'pointer',
                                  color: currentEditorState.isHidden
                                    ? theme.palette.primary.main
                                    : 'grey',
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </BubbleMenu>
                    )}
                    <EditorContent id={'editor-content'} editor={editor} />
                    {shouldDisplayPlaceholder() && (
                      <Typography
                        sx={{ color: 'grey', position: 'relative', top: -135 }}
                      >
                        Here is my cool placeholder
                      </Typography>
                    )}
                    {/* @ts-ignore */}
                    {unit.type === 'quest' && unit.loot && (
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
                <AddToContentButton
                  unit={unit}
                  handleAddImage={handleAddImage}
                />
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
        </FileDropzone>
      )}
    </>
  );
};
