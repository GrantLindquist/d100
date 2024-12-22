'use client';

import {
  Box,
  Button,
  Checkbox,
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
import { createEditor } from 'slate';
import {
  Element,
  Leaf,
  toggleMark,
  withLayout,
} from '@/components/content/slate/RichText';
import { HoveringToolbar } from '@/components/content/slate/HoveringToolbar';
import ArticleAside from '@/components/content/ArticleAside';

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

// TODO: Signal when there are unsaved changes
// TODO: Make drag/hover event work when initiated outside of slate editor
export const PageContent = () => {
  const [unit, setUnit] = useState<Article | Quest | null>(null);
  const [isUnsavedChanges, setUnsavedChanges] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { campaign, setBreadcrumbs } = useCampaign();
  const { displayAlert } = useAlert();
  const pathname = usePathname();

  const editor = useMemo(() => withLayout(withReact(createEditor())), []);
  const renderElement = useCallback((props: any) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  const sectionTitles = editor.children
    .filter((e) => e.type === 'title' || e.type === 'subtitle') // Filter elements
    .map((e) => {
      return e.children.map((child) => child.text).join('');
    });

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
                    <Button onClick={() => console.log(editor.children)}>
                      Print editor
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
                  {/* TODO: Enable history */}
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
                      onDOMBeforeInput={(event: InputEvent) => {
                        switch (event.inputType) {
                          case 'formatBold':
                            event.preventDefault();
                            return toggleMark(editor, 'bold');
                          case 'formatItalic':
                            event.preventDefault();
                            return toggleMark(editor, 'italic');
                          case 'formatUnderline':
                            event.preventDefault();
                            return toggleMark(editor, 'underlined');
                        }
                      }}
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
