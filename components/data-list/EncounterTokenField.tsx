'use client';

import { Condition, Encounter, EncounterToken } from '@/types/Encounter';
import { Box, Card, Grid2, IconButton, Menu, MenuItem, Stack, Typography, useTheme } from '@mui/material';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { useAlert } from '@/hooks/useAlert';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import ImageFrame from '@/components/content/ImageFrame';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import { doc, getDoc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { useDrag } from '@use-gesture/react';
import RollInitiativeModal from '@/components/modals/RollInitiativeModal';
import CreateEncounterTokenModal from '@/components/modals/CreateEncounterTokenModal';
import DamageMenu from '@/components/DamageMenu';
import { ImageUrl } from '@/types/Unit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import { SmallIconButton, SmallIconButtonGroup } from '@/components/buttons/SmallIconButton';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import { outfit } from '@/components/AppWrapper';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

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
        <DamageMenu inflictedTokenId={selectedId} inflictingTokenId={tokenId} encounter={encounter}
                    closeMenu={() => setAnchor(null)} />
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

const EncounterTokenCard = (props: {
  token: EncounterToken;
  encounter: Encounter;
  isCurrentTurn: boolean
}) => {
  const { displayAlert } = useAlert();
  const theme = useTheme();

  const [conditions, setConditions] = useState<Condition[]>([]);
  const [tokenImage, setTokenImage] = useState<ImageUrl | null>(null);
  const [anchor, setAnchor] = useState(null);

  useEffect(() => {
    async function fetchTokenImage(articleId: string) {
      const articleDocSnap = await getDoc(doc(db, 'units', articleId));
      if (articleDocSnap.exists()) {
        setTokenImage(articleDocSnap.data().imageUrls[0]);
      }
    }

    if (props.token.articleId) {
      fetchTokenImage(props.token.articleId);
    } else {
      setTokenImage({
        src: props.token.isPlayer ? '/blank_ally_token_img.png' : '/blank_monster_token_img.png',
        ratio: 1,
      });
    }
  }, []);

  useEffect(() => {
    const { roundCount, turnCount, activeConditions } = props.encounter;
    const currentlyVisibleConditions = activeConditions.filter((condition) => {
      if (condition.roundEnd === null && condition.turnEnd === null) {
        return props.token.id === condition.inflictedTokenId && roundCount >= condition.roundInflicted;
      } else {
        return props.token.id === condition.inflictedTokenId && roundCount >= condition.roundInflicted && roundCount <= condition.roundEnd! && (roundCount !== condition.roundEnd || turnCount < condition.turnEnd!);
      }
    });

    setConditions(currentlyVisibleConditions);
  }, [props.token.id, props.encounter]);

  const handleClickMenu = (event: any) => {
    event.stopPropagation();
    setAnchor(event.currentTarget);
  };

  const handleDeleteToken = async () => {
    try {
      const newTokens = props.encounter.tokens.filter((token) => token.id !== props.token.id);
      const newInitiativeOrder = props.encounter.initiativeOrder.filter((order) => order.tokenId !== props.token.id);
      await updateDoc(doc(db, 'units', props.encounter.id), {
        tokens: newTokens,
        initiativeOrder: newInitiativeOrder,
      });
      displayAlert({
        message: props.token.title + ' was removed from the encounter.',
      });
    } catch (e: any) {
      displayAlert({
        message: 'An error occurred while deleting this token.',
        errorType: e.message,
        isError: true,
      });
    }
  };

  const handleRemoveCondition = async (removeIndex: number) => {
    const removeCondition = conditions[removeIndex];
    removeCondition.roundEnd = props.encounter.roundCount;
    removeCondition.turnEnd = props.encounter.turnCount;

    const newConditions = conditions.filter((_, index) => index !== removeIndex);
    newConditions.push(removeCondition);

    setConditions(newConditions);
    await updateDoc(doc(db, 'units', props.encounter.id), {
      activeConditions: newConditions,
    });
  };

  return (
    <>
      <ConditionsInterface handleRemoveCondition={handleRemoveCondition} conditions={conditions}>
        <Card sx={{
          userSelect: 'none',
          border: `2px solid ${props.isCurrentTurn ? theme.palette.primary.main : 'transparent'}`,
        }}>
          <div style={{ filter: props.token.isDead ? 'grayscale(1)' : '' }}>
            <ImageFrame
              image={tokenImage}
              alt={props.token.title}
            />
          </div>
          <Box
            py={1}
            px={1.5}
          >
            <Stack direction={'row'} alignItems={'flex-start'}>
              <Typography flexGrow={1} variant={'subtitle2'}>{props.token.title}</Typography>
              <IconButton
                onClick={handleClickMenu}
                disableRipple
                disableFocusRipple
                sx={{
                  paddingY: 0,
                  paddingX: 1,
                  marginRight: -.5,
                  width: '10%',
                  zIndex: 30,
                }}
              >
                <MoreVertIcon
                  sx={{
                    width: 18,
                    height: 18,
                  }}
                />
              </IconButton>
            </Stack>
            <Typography variant={'subtitle2'}
                        color={'grey'}>{`${props.token.tempHitPoints > 0 ? `(${props.token.tempHitPoints})` : ''} ${props.token.currentHitPoints}/${props.token.maxHitPoints} HP`}</Typography>
          </Box>
        </Card>
      </ConditionsInterface>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        disableScrollLock
      >
        <MenuItem
          onClick={handleDeleteToken}
        >
          <DeleteIcon sx={{ width: 20, height: 20 }} />
          &nbsp; Delete
        </MenuItem>
      </Menu>
    </>
  );
};

const EncounterTokenField = (props: { encounter: Encounter; masonryBreakpoints: any }) => {
  const { displayAlert } = useAlert();

  const [isEditing, setEditing] = useState(false);
  const [encounterTitle, setEncounterTitle] = useState(props.encounter.title);
  const [turnCount, setTurnCount] = useState(props.encounter.turnCount);
  const [roundCount, setRoundCount] = useState(props.encounter.roundCount);

  const currentTurnToken = roundCount > 0 ? props.encounter.tokens.find((token) => token.id === props.encounter.initiativeOrder[turnCount].tokenId) : null;

  const confirmTitleChange = async () => {
    if (props.encounter.title !== encounterTitle) {
      await updateDoc((doc(db, 'units', props.encounter.id)), {
        title: encounterTitle,
      });
    }
    setEditing(false);
  };

  const moveTurn = async (direction: 1 | -1) => {
    const initiativeLength = props.encounter.initiativeOrder.length;
    let newTurn = turnCount;
    let newRound = roundCount;

    for (let _ = 0; _ < initiativeLength; _++) {
      newTurn += direction;
      if (newTurn >= initiativeLength) {
        newTurn = 0;
        newRound += 1;
      } else if (newTurn < 0) {
        newTurn = initiativeLength - 1;
        newRound -= 1;
      }
      if (props.encounter.initiativeOrder[newTurn].isActive) {
        break;
      }
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
    {isEditing ? <input
      value={encounterTitle}
      onChange={(e) => setEncounterTitle(e.target.value)}
      autoFocus
      style={{
        all: 'unset',
        fontSize: '3.7rem',
        height: '4.5rem',
        fontWeight: BOLD_FONT_WEIGHT,
        fontFamily: outfit.style.fontFamily,
        cursor: 'text',
      }}
    /> : <Typography variant="h2" fontWeight={BOLD_FONT_WEIGHT} sx={{
      fontFamily: outfit.style.fontFamily,
    }}>
      {encounterTitle}
    </Typography>}
    <Stack direction={'row'} spacing={2} mb={1} alignItems={'center'}>
      {currentTurnToken ?
        <Stack direction={'row'} spacing={1}
               sx={{
                 backgroundColor: '#222',
                 borderRadius: 50,
               }}>
          <IconButton onClick={() => moveTurn(-1)} disabled={roundCount === 1 && turnCount === 0}>
            <KeyboardArrowLeftIcon />
          </IconButton>
          <Box sx={{
            width: { xs: 'auto', sm: '300px' },
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex',
            gap: 1,
          }}>
            <Typography sx={{ color: 'grey', whiteSpace: 'nowrap' }}>{`Round ${roundCount}`}</Typography>
            <Typography sx={{
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              display: { xs: 'none', sm: 'inline' },
            }}>
              {currentTurnToken.title}&apos;s Turn
            </Typography>
          </Box>
          <IconButton onClick={() => moveTurn(1)}>
            <KeyboardArrowRightIcon />
          </IconButton>
        </Stack>
        : <Typography color={'grey'}>Roll Initiative to begin the Encounter</Typography>}
      <SmallIconButtonGroup>
        <RollInitiativeModal encounter={props.encounter} setRoundCount={setRoundCount} />
        {isEditing ?
          <SmallIconButton icon={<CheckIcon />} onClick={confirmTitleChange} /> :
          <SmallIconButton icon={<EditIcon />} onClick={() => setEditing(true)} />}
        <CreateEncounterTokenModal encounter={props.encounter} />
      </SmallIconButtonGroup>
    </Stack>
    <Grid2 container columns={13} spacing={2} p={3} sx={{ overflowY: 'auto', height: '70vh' }}>
      <Grid2 size={6}>
        <ResponsiveMasonry columnsCountBreakPoints={props.masonryBreakpoints}>
          <Masonry itemStyle={{ alignItems: 'flex-end' }}>
            {props.encounter.tokens.filter((token) => token.isPlayer).map((token) => (
              <DragInterface key={token.id} encounter={props.encounter} tokenId={token.id}>
                <EncounterTokenCard token={token} encounter={props.encounter}
                                    isCurrentTurn={token.id === currentTurnToken?.id} />
              </DragInterface>
            ))}
          </Masonry>
        </ResponsiveMasonry>
      </Grid2>
      <Grid2 size={1} justifyContent={'center'} display={'flex'}>
        <Box sx={{ backgroundColor: '#222', width: '1px', height: '100%' }}></Box>
      </Grid2>
      <Grid2 size={6}>
        <ResponsiveMasonry columnsCountBreakPoints={props.masonryBreakpoints}>
          <Masonry>
            {props.encounter.tokens.filter((token) => !token.isPlayer).map((token) => (
              <DragInterface key={token.id} encounter={props.encounter} tokenId={token.id}>
                <EncounterTokenCard token={token} encounter={props.encounter}
                                    isCurrentTurn={token.id === currentTurnToken?.id} />
              </DragInterface>
            ))}
          </Masonry>
        </ResponsiveMasonry>
      </Grid2>
    </Grid2>
  </>;
};
export default EncounterTokenField;