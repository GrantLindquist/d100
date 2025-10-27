import { outfit } from '@/components/AppWrapper';
import { useAlert } from '@/hooks/useAlert';
import { useCampaign } from '@/hooks/useCampaign';
import { Collection } from '@/types/Unit';
import db, { storage } from '@/utils/firebase';
import { BOLD_FONT_WEIGHT, MODAL_STYLE } from '@/utils/globals';
import { generateUUID } from '@/utils/uuid';
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
} from '@firebase/firestore';
import { deleteObject, getBlob, getDownloadURL, ref, uploadBytes } from '@firebase/storage';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Modal,
  Stack,
  Typography
} from '@mui/material';
import { useEffect, useState } from 'react';

const CollectionCheckbox = (props: {
  checked: boolean;
  collection: Collection;
  isOrigin: boolean;
  updateState: Function;
}) => {
  return (
    <FormControlLabel
      control={
        <Checkbox
          sx={{ height: 30, width: 30, marginX: 1 }}
          checked={props.checked}
          onChange={(event) =>
            props.updateState(event.target.checked, props.collection.id)
          }
        />
      }
      label={
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ display: 'inline' }}>
            {props.collection.title}
          </Typography>
          {props.isOrigin && (
            <Typography
              component="span"
              color="grey"
              sx={{ display: 'inline', marginLeft: 1 }}
            >
              (origin)
            </Typography>
          )}
        </Box>
      }
    />
  );
};

// TODO: Disable button if there are no sub-collections in campaign
const MoveUnitsModal = (props: {
  selectedUnitIds: string[];
  disabled: boolean;
  setEditing: Function;
  currentCollection: Collection;
}) => {
  const { campaign } = useCampaign();
  const { displayAlert } = useAlert();

  const [modalOpen, setModalOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    [],
  );
  const [confirmButtonDisabled, setConfirmButtonDisabled] = useState(false);

  // TODO: Organize collections in parental order
  useEffect(() => {
    const getCollections = async (campaignId: string) => {
      const collections: Collection[] = [];
      const collectionQuery = query(
        collection(db, 'units'),
        where('campaignId', '==', campaignId),
        where('type', '==', 'collection'),
      );
      const collectionQuerySnap = await getDocs(collectionQuery);
      collectionQuerySnap.forEach((doc) => {
        collections.push(doc.data() as Collection);
      });
      setCollections(collections);
    };

    if (campaign) {
      try {
        getCollections(campaign.id);
      } catch (e: any) {
        displayAlert({
          message: 'An error occurred while fetching collections.',
          errorType: e.message,
        });
      }
    }
  }, [props.selectedUnitIds, campaign?.id]);

  const updateSelectedCollectionIds = (
    checked: boolean,
    collectionId: string,
  ) => {
    setSelectedCollectionIds((prev) =>
      checked
        ? [...prev, collectionId]
        : prev.filter((id) => id !== collectionId),
    );
  };

  const handleMoveUnits = async (event: any) => {
    event.preventDefault();

    try {
      await runTransaction(db, async (transaction) => {
        for (const staleUnitId of props.selectedUnitIds) {
          const unitDocSnap = await getDoc(doc(db, 'units', staleUnitId));
          if (!unitDocSnap.exists()) continue;

          const staleUnitData = unitDocSnap.data();

          for (let collectionId of selectedCollectionIds) {
            const collectionDocSnap = await getDoc(doc(db, 'units', collectionId));
            if (!collectionDocSnap.exists()) continue;

            const clonedUnitId = generateUUID();
            const breadcrumbs = [...collectionDocSnap.data().breadcrumbs];
            breadcrumbs.push({
              unitId: clonedUnitId,
              url: `/campaigns/${campaign!.id}/${staleUnitData.type}s/${clonedUnitId}`,
            });

            const newImageUrls = [];
            for (const image of staleUnitData.imageUrls) {
              const staleImageRef = ref(storage, image.src);
              const blob = await getBlob(staleImageRef);

              const newImageId = clonedUnitId + '-' + generateUUID();
              const newImagePath = `${campaign!.id}/${newImageId}`;
              const newImageRef = ref(storage, newImagePath);

              await uploadBytes(newImageRef, blob);
              const downloadURL = await getDownloadURL(newImageRef);

              newImageUrls.push({
                src: downloadURL,
                ratio: image.ratio,
              });
            }

            const clonedUnit = {
              ...staleUnitData,
              id: clonedUnitId,
              breadcrumbs,
              imageUrls: newImageUrls,
            };

            transaction.set(doc(db, 'units', clonedUnitId), clonedUnit);
            transaction.update(doc(db, 'units', collectionId), {
              unitIds: arrayUnion(clonedUnitId),
            });
          }

          for (const image of unitDocSnap.data().imageUrls) {
            const staleImageRef = ref(storage, image.src);
            await deleteObject(staleImageRef);
          }

          transaction.update(doc(db, 'units', props.currentCollection.id), {
            unitIds: arrayRemove(staleUnitId),
          });
          transaction.delete(doc(db, 'units', staleUnitId));
        }
      });

      displayAlert({
        message: `${props.selectedUnitIds.length} items successfully moved.`,
      });
    } catch (e: any) {
      displayAlert({
        message: 'An error occurred while moving your articles.',
        errorType: e.message,
      });
    }

    setModalOpen(false);
    
    props.setEditing(false);
  };

  return (
    <>
      <Box onClick={(event) => {
        event.stopPropagation();
        setModalOpen(true);
      }} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DriveFileMoveIcon />
        Move Items
      </Box>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={MODAL_STYLE} onClick={(event) => event.stopPropagation()}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: outfit.style.fontFamily,
              fontWeight: BOLD_FONT_WEIGHT,
            }}
          >
            Move Articles
          </Typography>
          <Divider sx={{ marginY: 1 }} />
          {collections ? (
            <Stack direction={'column'}>
              {collections.map((collection) => (
                <CollectionCheckbox
                  key={collection.id}
                  checked={selectedCollectionIds.includes(collection.id)}
                  collection={collection}
                  isOrigin={collection.title === props.currentCollection.title}
                  updateState={updateSelectedCollectionIds}
                />
              ))}
              <Button disabled={confirmButtonDisabled} sx={{ marginTop: 2 }} onClick={(event) => {
                setConfirmButtonDisabled(true);
                handleMoveUnits(event).finally(() => setConfirmButtonDisabled(false));
              }}>
                Move Items
              </Button>
            </Stack>
          ) : (
            <CircularProgress size={30} sx={{ marginY: 2 }} color="inherit" />
          )}
        </Box>
      </Modal>
    </>
  );
};
export default MoveUnitsModal;
