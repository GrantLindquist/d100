import { Box, Button, Divider, Modal, Stack, Typography } from '@mui/material';
import { BOLD_FONT_WEIGHT, MODAL_STYLE } from '@/utils/globals';
import CasinoIcon from '@mui/icons-material/Casino';
import { useEffect, useState } from 'react';
import { Encounter, EncounterToken, Initiative } from '@/types/Encounter';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { doc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { useAlert } from '@/hooks/useAlert';

const SortableToken = (props: { token: EncounterToken }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.token.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
    cursor: 'move',
  };

  return (<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
    <Stack key={props.token.id} py={.5} direction={'row'}>
      <Typography flexGrow={1}>{props.token.title}</Typography>
      <DragIndicatorIcon />
    </Stack>
  </div>);
};

const RollInitiativeModal = (props: { encounter: Encounter; setRoundCount: Function }) => {

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const { displayAlert } = useAlert();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    if (props.encounter.initiativeOrder.length > 0) {
      const initiativeTokens = props.encounter.initiativeOrder.map((order) => order.tokenId);
      const tokensExcludedFromInitiative = props.encounter.tokens.filter((token: EncounterToken) => !initiativeTokens.includes(token.id));
      setItems([...initiativeTokens, ...tokensExcludedFromInitiative.map((token) => token.id)]);
    } else {
      setItems(props.encounter.tokens.map((item) => item.id));
    }
  }, [props.encounter.tokens]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSetInitiativeOrder = async () => {
    try {
      const roundCount = props.encounter.roundCount === 0 ? 1 : props.encounter.roundCount;
      const initiativeOrder: Initiative[] = items.map((id) => {
        return {
          tokenId: id,
          isActive: true,
        };
      });
      await updateDoc(doc(db, 'units', props.encounter.id), {
        initiativeOrder: initiativeOrder,
        roundCount: roundCount,
      });
      props.setRoundCount(roundCount);
      setOpen(false);
    } catch (e: any) {
      displayAlert({
        message: 'An error occurred while setting initiative',
        errorType: e.message,
        isError: true,
      });
    }
  };

  return (<>
    <Button startIcon={<CasinoIcon />} disabled={props.encounter.tokens.length === 0}
            onClick={() => setOpen(true)}>
      Roll Initiative
    </Button>
    <Modal open={open} onClose={() => setOpen(false)}>
      <Box sx={MODAL_STYLE}>
        <Typography variant={'h4'} fontWeight={BOLD_FONT_WEIGHT}>Order by Initiative</Typography>
        <Divider sx={{ paddingY: .5 }} />
        <Box py={1}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              {items.map((itemId) => {
                const token = props.encounter.tokens.find((token) => token.id === itemId);
                if (!token) return null;

                return <SortableToken key={itemId} token={token} />;
              })}
            </SortableContext>
          </DndContext>
        </Box>
        <Box pt={2} justifyContent={'center'} width={'100%'} display={'flex'}>
          <Button onClick={handleSetInitiativeOrder}>Set Initiative Order</Button>
        </Box>
      </Box>
    </Modal>
  </>);
};
export default RollInitiativeModal;