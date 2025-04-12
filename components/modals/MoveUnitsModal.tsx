import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  Modal,
  Stack,
  Typography,
} from '@mui/material';
import { BOLD_FONT_WEIGHT, MODAL_STYLE } from '@/utils/globals';
import { useEffect, useState } from 'react';
import { outfit } from '@/components/AppWrapper';
import { Collection } from '@/types/Unit';
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
import db from '@/utils/firebase';
import { useCampaign } from '@/hooks/useCampaign';
import { useAlert } from '@/hooks/useAlert';
import { generateUUID } from '@/utils/uuid';

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
          isError: true,
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

    // TODO: Clone reference images as well.
    try {
      await runTransaction(db, async (transaction) => {
        for (const staleUnitId of props.selectedUnitIds) {
          const unitDocSnap = await getDoc(doc(db, 'units', staleUnitId));
          for (let collectionId of selectedCollectionIds) {
            const collectionDocSnap = await getDoc(doc(db, 'units', collectionId));
            if (unitDocSnap.exists() && collectionDocSnap.exists()) {

              const clonedUnitId = generateUUID();
              let breadcrumbs = collectionDocSnap.data().breadcrumbs;
              breadcrumbs.push({
                unitId: clonedUnitId,
                url: `/campaigns/${campaign!.id}/${unitDocSnap.data().type}s/${clonedUnitId}`,
              });

              const clonedUnit = {
                ...unitDocSnap.data(),
                id: clonedUnitId,
                breadcrumbs: breadcrumbs,
              };

              transaction.set(doc(db, 'units', clonedUnitId), clonedUnit);
              transaction.update(doc(db, 'units', collectionId), {
                unitIds: arrayUnion(clonedUnitId),
              });
            }
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
        isError: true,
        errorType: e.message,
      });
    }

    setModalOpen(false);
    props.setEditing(false);
  };

  return (
    <>
      <IconButton
        size="large"
        disabled={props.disabled}
        onClick={() => setModalOpen(true)}
      >
        <DriveFileMoveIcon />
      </IconButton>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={MODAL_STYLE}>
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
              <Button sx={{ marginTop: 2 }} onClick={handleMoveUnits}>
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
