'use client';

import { Condition, Encounter, EncounterToken } from '@/types/Encounter';
import { Box, Card, Grid2, IconButton, Menu, Stack, Typography, useTheme } from '@mui/material';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { useAlert } from '@/hooks/useAlert';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import ImageFrame from '@/components/content/ImageFrame';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import { arrayRemove, doc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { useDrag } from '@use-gesture/react';
import RollInitiativeModal from '@/components/modals/RollInitiativeModal';
import CreateEncounterTokenModal from '@/components/modals/CreateEncounterTokenModal';
import DamageMenu from '@/components/DamageMenu';

const DragInterface = ({ children, encounter, tokenId }: {
  children: ReactNode;
  encounter: Encounter;
  tokenId: string
}) => {

  const theme = useTheme();

  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [endPos, setEndPos] = useState<{ x: number; y: number } | null>(null);
  const sourceRef = useRef<HTMLDivElement>(null);

  const bind = useDrag(({ first, last, xy }) => {
    const [x, y] = xy;

    if (first) {
      const rect = document.getElementById(tokenId)?.getBoundingClientRect();
      if (rect) {
        setStartPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
      setDragging(true);
    }

    if (!last) {
      setEndPos({ x, y });
    } else {
      setDragging(false);
      setEndPos(null);

      const target = document.elementFromPoint(x, y) as HTMLElement | null;
      if (target) {
        setSelectedId(target.id);
        setAnchor(target);
      }
    }
  }, {});

  return (
    <>
      {selectedId && <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
      >
        <DamageMenu inflictedTokenId={selectedId} encounter={encounter} closeMenu={() => setAnchor(null)} />
      </Menu>}
      <Box
        sx={{ position: 'relative' }}>
        <Box
          id={tokenId}
          ref={sourceRef}
          {...bind()}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
            touchAction: 'none',
          }}
        >
        </Box>
        {children}
      </Box>
      {dragging && startPos && endPos && (
        <svg
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 20 }}
          width="100%"
          height="100%"
        >
          <line
            x1={startPos.x}
            y1={startPos.y}
            x2={endPos.x}
            y2={endPos.y}
            stroke={theme.palette.primary.main}
            strokeWidth="3"
            markerEnd="url(#arrowhead)"
          />
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={theme.palette.primary.main} />
            </marker>
          </defs>
        </svg>
      )}
    </>
  );
};

const ConditionsInterface = ({ children, conditions, handleRemoveCondition }: {
  children: ReactNode;
  handleRemoveCondition: Function;
  conditions: Condition[]
}) => {

  return <Box
    sx={{ position: 'relative' }}>
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <Box p={1} sx={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: .5,
      }}>
        {conditions.map((condition: Condition, index) => <Box key={`${condition.name}-${index}`}
                                                              sx={{
                                                                backgroundColor: '#8B0000',
                                                                borderRadius: 1,
                                                                zIndex: 11,
                                                                cursor: 'pointer',
                                                              }}>
          <Typography onClick={() => handleRemoveCondition(index)} variant={'subtitle2'}
                      px={.5}>{condition.name}</Typography></Box>)}
      </Box>
    </Box>
    {children}
  </Box>;
};

// TODO: Consider implementing a hook for encounters
const EncounterTokenCard = (props: {
  token: EncounterToken;
  encounter: Encounter;
  isCurrentTurn: boolean
}) => {

  const [conditions, setConditions] = useState<Condition[]>([]);

  useEffect(() => {
    const currentActiveConditions = props.encounter.activeConditions.filter((condition) => {
      return condition.inflictedTokenId === props.token.id &&
        props.encounter.roundCount >= condition.roundInflicted &&
        props.encounter.roundCount <= condition.roundInflicted + condition.roundDuration;
    });

    setConditions(currentActiveConditions);
  }, [props.encounter.turnCount]);

  const handleRemoveCondition = async (removeIndex: number) => {
    const removeCondition = conditions[removeIndex];
    setConditions(conditions.filter((_, index) => index !== removeIndex));
    await updateDoc(doc(db, 'units', props.encounter.id), {
      activeConditions: arrayRemove(removeCondition),
    });
  };

  return (
    <ConditionsInterface handleRemoveCondition={handleRemoveCondition} conditions={conditions}>
      <Card sx={{
        userSelect: 'none',
        maxWidth: '150px',
        maxHeight: '230px',
        border: `2px solid ${props.isCurrentTurn ? 'yellow' : 'transparent'}`,
      }}>
        {/*{props.article.imageUrls.length > 0 && (*/}
        {/*  <ImageFrame*/}
        {/*    image={props.article.imageUrls[0]}*/}
        {/*    alt={props.article.title}*/}
        {/*  />*/}
        {/*)}*/}
        <div style={{ filter: props.token.isDead ? 'grayscale(1)' : '' }}>
          <ImageFrame
            image={{
              src: '/blank_token_img.png',
              ratio: 1,
            }}
          />
        </div>
        <Box
          py={1}
          px={1.5}
          maxHeight={300}
        >
          <Typography variant={'subtitle2'} fontWeight={BOLD_FONT_WEIGHT}>{props.token.title}</Typography>
          <Typography variant={'subtitle2'}
                      color={'grey'}>{`${props.token.tempHitPoints > 0 ? `(${props.token.tempHitPoints})` : ''} ${props.token.currentHitPoints}/${props.token.maxHitPoints} HP`}</Typography>
        </Box>
      </Card>
    </ConditionsInterface>
  );
};


const EncounterTokenField = (props: { encounter: Encounter }) => {
  const { displayAlert } = useAlert();

  const [turnCount, setTurnCount] = useState(props.encounter.turnCount);
  const [roundCount, setRoundCount] = useState(props.encounter.roundCount);

  const currentTurnToken = roundCount > 0 ? props.encounter.tokens.find((token) => token.id === props.encounter.initiativeOrder[turnCount]) : null;

  const moveTurn = async (direction: 1 | -1) => {
    let newTurn = turnCount;
    let newRound = roundCount;
    newTurn += direction;

    if (newTurn >= props.encounter.initiativeOrder.length) {
      newTurn = 0;
      newRound += 1;
    } else if (newTurn < 0) {
      newTurn = props.encounter.initiativeOrder.length - 1;
      newRound -= 1;
    }
    setTurnCount(newTurn);
    newRound != roundCount && setRoundCount(newRound);

    try {
      await updateDoc(doc(db, 'units', props.encounter.id), {
        roundCount: newRound,
        turnCount: newTurn,
      });
    } catch (e: any) {
      displayAlert({
        message: 'An error occurred while updating your encounter.',
        errorType: e.message,
        isError: true,
      });
    }
  };

  return <>
    <Stack direction={'row'} spacing={1} py={1}>
      {currentTurnToken ?
        <Stack direction={'row'}
               sx={{
                 backgroundColor: '#222',
                 borderRadius: 4,
                 alignItems: 'center',
                 width: '400px',
                 justifyContent: 'space-between',
               }}>
          <IconButton onClick={() => moveTurn(-1)} disabled={roundCount === 1 && turnCount === 0}>
            <KeyboardArrowLeftIcon />
          </IconButton>
          <Typography>
            {`Round ${roundCount} ㆍ ${currentTurnToken.title}'s Turn`}
          </Typography>
          <IconButton onClick={() => moveTurn(1)}>
            <KeyboardArrowRightIcon />
          </IconButton>
        </Stack> : <Typography color={'grey'}>Roll Initiative to begin the Encounter</Typography>}
      <Box sx={{ flexGrow: 1 }}></Box>
      <CreateEncounterTokenModal encounter={props.encounter} />
      <RollInitiativeModal encounter={props.encounter} setRoundCount={setRoundCount} />
    </Stack>
    <Grid2 container columns={13} spacing={2} p={3}>
      <Grid2 size={6} sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'right' }}>
        {props.encounter.tokens.filter((token) => token.isPlayer).map((token) => (
          <DragInterface key={token.id} encounter={props.encounter} tokenId={token.id}>
            <EncounterTokenCard token={token} encounter={props.encounter}
                                isCurrentTurn={token.id === currentTurnToken?.id} />
          </DragInterface>
        ))}
      </Grid2>
      <Grid2 size={1} justifyContent={'center'} display={'flex'}>
        <Box sx={{ backgroundColor: '#222', width: '1px', height: '100%' }}></Box>
      </Grid2>
      <Grid2 size={6} sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
        {props.encounter.tokens.filter((token) => !token.isPlayer).map((token) => (
          <DragInterface key={token.id} encounter={props.encounter} tokenId={token.id}>
            <EncounterTokenCard token={token} encounter={props.encounter}
                                isCurrentTurn={token.id === currentTurnToken?.id} />
          </DragInterface>
        ))}
      </Grid2>
    </Grid2>
  </>;
};
export default EncounterTokenField;