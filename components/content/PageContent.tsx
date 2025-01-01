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
} from '@mui/material';
import { Article, Breadcrumb, ImageUrl, Quest } from '@/types/Unit';
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { Editable, Slate, withReact } from 'slate-react';
import CheckIcon from '@mui/icons-material/Check';
import { createEditor, Transforms } from 'slate';
import { Element, Leaf, withLayout } from '@/components/content/slate/RichText';
import { HoveringToolbar } from '@/components/content/slate/HoveringToolbar';
import ArticleAside from '@/components/content/ArticleAside';
import { withHistory } from 'slate-history';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// TODO: Make drag/hover event work when initiated outside of slate editor
export const PageContent = () => {
  const [unit, setUnit] = useState<Article | Quest | null>(null);
  const [isUnsavedChanges, setUnsavedChanges] = useState(false);
  const [sectionTitles, setSectionTitles] = useState([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { campaign, setBreadcrumbs, isUserDm } = useCampaign();
  const { displayAlert } = useAlert();
  const pathname = usePathname();

  const editor = useMemo(
    () => withLayout(withReact(withHistory(createEditor()))),
    []
  );

  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback(
    (props: { attributes: any; children: any; leaf: any }) => {
      if (props.leaf.hidden && !isUserDm) {
        return <></>;
      }
      return <Leaf {...props} />;
    },
    [isUserDm]
  );

  useEffect(() => {
    const titles = editor.children
      .filter(
        (e: any) =>
          (e.type === 'title' || e.type === 'subtitle') &&
          (isUserDm || !e.children[0].hidden)
      )
      .map((e: any) => {
        return e.children.map((child: any) => child.text).join('');
      });
    setSectionTitles(titles);
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

  const handleSaveContent = async () => {
    if (unit) {
      try {
        const unitTitle = editor.children[0].children[0].text ?? unit.title;
        await updateDoc(doc(db, 'units', unit.id), {
          content: editor.children,
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

  const toggleHideUnit = async (toggle: boolean) => {
    try {
      if (unit) {
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

  const handlePaste = (event: any) => {
    const text = event.clipboardData?.getData('text') ?? null;
    const urlRegex = new RegExp(
      '^(https?:\\/\\/)?(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}(\\b[-a-zA-Z0-9@:%_\\+.~#?&//=]*)?$'
    );
    const link = {
      type: 'link',
      children: [{ text: text }],
    };
    if (text && urlRegex.test(text)) {
      // event.preventDefault() is necessary to prevent clipboard from pasting twice
      event.preventDefault();
      Transforms.insertNodes(editor, link);
    }
  };

  const handleKeyDown = (event: any) => {
    console.log(editor.selection);
    if (event.key === 'space') {
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

                  <Slate
                    editor={editor}
                    initialValue={unit.content}
                    onChange={() => {
                      const isAstChange = editor.operations.some(
                        (op: any) => 'set_selection' !== op.type
                      );
                      if (isAstChange) {
                        setUnsavedChanges(true);
                      }
                    }}
                  >
                    <HoveringToolbar />
                    <Editable
                      id={'editable'}
                      renderElement={renderElement}
                      renderLeaf={renderLeaf}
                      onPaste={handlePaste}
                      onKeyDown={handleKeyDown}
                      style={{
                        outline: 'none',
                      }}
                    />
                  </Slate>
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
