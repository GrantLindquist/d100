'use client';

import { Encounter, EncounterToken } from '@/types/Encounter';
import {
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  Grid2,
  IconButton,
  InputLabel,
  Menu,
  Modal,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { ChangeEvent, FormEvent, ReactNode, useRef, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAlert } from '@/hooks/useAlert';
import { BOLD_FONT_WEIGHT, MODAL_STYLE } from '@/utils/globals';
import { generateUUID } from '@/utils/uuid';
import ImageFrame from '@/components/content/ImageFrame';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import { doc, getDoc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { useDrag } from '@use-gesture/react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { usePathname } from 'next/navigation';
import { getCurrentUnitIdFromUrl } from '@/utils/url';

const DamageMenuContent = (props: { inflictedTokenId: string; closeMenu: Function }) => {
  const { displayAlert } = useAlert();
  const pathname = usePathname();

  const [healthCounter, setHealthCounter] = useState(0);
  const [applyTempHitPointsChecked, setApplyTempHitPointsChecked] = useState(false);

  const tickHealth = (direction: -1 | 1) => {
    let temp = healthCounter;
    temp += direction;
    setHealthCounter(temp);
  };

  const handleApplyHitPoints = async () => {
    try {
      const unitId = getCurrentUnitIdFromUrl(pathname.split('/').slice(1));
      const encounterDocRef = doc(db, 'units', unitId!);
      const encounterDoc = await getDoc(encounterDocRef);
      if (encounterDoc.exists()) {
        const tokens = encounterDoc.data().tokens;
        const inflictedToken = tokens.find((token: EncounterToken) => token.id === props.inflictedTokenId) as EncounterToken;
        if (inflictedToken) {
          if (healthCounter < 0) {
            if (inflictedToken.tempHitPoints > 0) {
              const difference = inflictedToken.tempHitPoints + healthCounter;
              if (difference < 0) {
                inflictedToken.tempHitPoints = 0;
                inflictedToken.currentHitPoints += difference;
              } else {
                inflictedToken.tempHitPoints += healthCounter;
              }
            } else {
              inflictedToken.currentHitPoints += healthCounter;
            }
          } else {
            if (applyTempHitPointsChecked) {
              if (healthCounter > inflictedToken.tempHitPoints) {
                inflictedToken.tempHitPoints = healthCounter;
              }
            } else {
              inflictedToken.currentHitPoints += healthCounter;
            }
          }

          const newTokens = tokens.map((token: EncounterToken) =>
            token.id === inflictedToken.id ? inflictedToken : token,
          );
          await updateDoc(encounterDocRef, {
            tokens: newTokens,
          });
        } else {
          displayAlert({
            message: 'Unable to locate inflicted token in encounter document.',
            isError: true,
          });
        }
      } else {
        displayAlert({
          message: 'Unable to locate encounter document in Firebase.',
          isError: true,
        });
      }
    } catch (e: any) {
      displayAlert({
        message: e.message,
        isError: true,
      });
    }

    props.closeMenu();
  };

  return <Box p={1}>
    <Stack direction={'row'}
           sx={{
             backgroundColor: '#222',
             borderRadius: 1,
             alignItems: 'center',
             width: '150px',
             justifyContent: 'space-between',
           }}>
      <IconButton onClick={() => tickHealth(-1)}>
        <AddIcon />
      </IconButton>
      <TextField
        variant={'outlined'}
        size={'small'}
        value={healthCounter}
        type={'number'}
        onChange={(event) => {
          // TODO: Remove leading zeros
          const value = Number(event.target.value);
          if (value <= 999) {
            setHealthCounter(value);
          }
        }}
        sx={{
          '& fieldset': { border: 'none' },
          '& input': {
            textAlign: 'center',
          },
          '& input[type=number]': {
            MozAppearance: 'textfield',
            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
          },
        }}
      />
      <IconButton onClick={() => tickHealth(1)}>
        <RemoveIcon />
      </IconButton>
    </Stack>
    {healthCounter > 0 && (
      <Stack direction={'row'} justifyContent={'center'} alignItems={'center'}>
        <Typography>
          Temp HP
        </Typography>
        <Checkbox
          checked={applyTempHitPointsChecked}
          onChange={(event) => setApplyTempHitPointsChecked(event.target.checked)}
        />
      </Stack>
    )}
    <Button disabled={healthCounter === 0} variant="contained" onClick={handleApplyHitPoints}
            sx={{ color: 'white', backgroundColor: healthCounter > 0 ? 'green' : 'red', width: '100%' }}>
      {healthCounter > 0 ? 'Heal' : 'Damage'}
    </Button>
  </Box>;
};


const DragInterface = ({ children, tokenId }: { children: ReactNode; tokenId: string }) => {

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
        <DamageMenuContent inflictedTokenId={selectedId} closeMenu={() => setAnchor(null)} />
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

const CreateEncounterTokenModal = (props: { encounter: Encounter }) => {
  const [open, setOpen] = useState(false);

  const CreateEncounterTokenForm = () => {
    const { user } = useUser();
    const { displayAlert } = useAlert();
    const [formData, setFormData] = useState({
      tokenTitle: '',
      tokenHitPoints: 1,
      tokenIsPlayer: 'off',
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (user) {
        try {
          const newEncounterToken: EncounterToken = {
            id: generateUUID(),
            title: formData.tokenTitle,
            currentHitPoints: formData.tokenHitPoints,
            maxHitPoints: formData.tokenHitPoints,
            tempHitPoints: 0,
            conditions: [],
            isPlayer: formData.tokenIsPlayer === 'on',
          };
          await updateDoc(doc(db, 'units', props.encounter.id), {
            tokens: [...props.encounter.tokens, newEncounterToken],
          });
          setOpen(false);
        } catch (e: any) {
          displayAlert({
            message: 'An error occurred while creating a token.',
            isError: true,
            errorType: e.message,
          });
        }
      }
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    };

    return (
      <form onSubmit={handleSubmit}>
        <Stack spacing={1}>
          <InputLabel>Token Title</InputLabel>
          <TextField
            name="tokenTitle"
            variant="outlined"
            size="small"
            fullWidth
            value={formData.tokenTitle}
            onChange={handleInputChange}
          />
          <InputLabel>Starting HP</InputLabel>
          <TextField
            name="tokenHitPoints"
            variant="outlined"
            size="small"
            type="number"
            value={formData.tokenHitPoints}
            onChange={handleInputChange}
          />
          <FormControlLabel
            control={
              <Checkbox
                name="tokenIsPlayer"
                checked={formData.tokenIsPlayer === 'on'}
                onChange={handleInputChange}
              />
            }
            label="Is Player/Ally"
          />
          <Button type="submit" disabled={!formData.tokenTitle.trim()}>
            Create Token
          </Button>
        </Stack>
      </form>
    );
  };


  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Token</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={MODAL_STYLE}>
          <CreateEncounterTokenForm />
        </Box>
      </Modal>
    </>
  );
};

const EncounterTokenCard = (props: { token: EncounterToken }) => {

  return <DragInterface tokenId={props.token.id}>
    <Card sx={{ userSelect: 'none', maxWidth: '150px', maxHeight: '230px' }}>
      {/*{props.article.imageUrls.length > 0 && (*/}
      {/*  <ImageFrame*/}
      {/*    image={props.article.imageUrls[0]}*/}
      {/*    alt={props.article.title}*/}
      {/*  />*/}
      {/*)}*/}
      <ImageFrame
        image={{
          src: '/blank_token_img.png',
          ratio: 1,
        }}
      />
      <Box
        py={1}
        px={1.5}
        maxHeight={300}
      >
        <Typography variant={'subtitle2'} fontWeight={BOLD_FONT_WEIGHT}>{props.token.title}</Typography>
        <Typography variant={'subtitle2'}
                    color={'grey'}>{`${props.token.tempHitPoints > 0 ? `(${props.token.tempHitPoints})` : ''} ${props.token.currentHitPoints}/${props.token.maxHitPoints} HP`}</Typography>
        {props.token.conditions.map((condition) => (
          <Typography variant={'subtitle2'} color={'grey'}>{condition.name}&nbsp;</Typography>))}
      </Box>
    </Card>
  </DragInterface>;
};


const EncounterTokenField = (props: { encounter: Encounter }) => {
  const [turnCount, setTurnCount] = useState(props.encounter.turnCount);
  const [roundCount, setRoundCount] = useState(props.encounter.roundCount);
  const [draggingToken, setDraggingToken] = useState<EncounterToken | null>(null);

  const currentTurnTokenTitle = roundCount > 0 ? props.encounter.tokens[turnCount].title : '';

  const moveTurn = async (direction: 1 | -1) => {
    let newTurn = turnCount;
    let newRound = roundCount;
    newTurn += direction;

    if (newTurn >= props.encounter.tokens.length) {
      newTurn = 0;
      newRound += 1;
    } else if (newTurn < 0) {
      newTurn = props.encounter.tokens.length - 1;
      newRound -= 1;
    }
    setTurnCount(newTurn);
    newRound != roundCount && setRoundCount(newRound);
  };

  const handleDragEnd = (endToken: EncounterToken) => {
    if (draggingToken) {
      console.log(draggingToken.title + ' has attacked ' + endToken.title);
      setDraggingToken(null);
    }
  };

  return <>
    <Stack direction={'row'} spacing={1} py={1} onDragEnd={() => setDraggingToken(null)}>
      {roundCount > 0 ?
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
            {`Round ${roundCount} ㆍ ${currentTurnTokenTitle}'s Turn`}
          </Typography>
          <IconButton onClick={() => moveTurn(1)}>
            <KeyboardArrowRightIcon />
          </IconButton>
        </Stack> : <Typography color={'grey'}>Roll Initiative to begin the Encounter</Typography>}
      <Box sx={{ flexGrow: 1 }}></Box>
      <CreateEncounterTokenModal encounter={props.encounter} />
      <Button disabled={props.encounter.tokens.length === 0} onClick={() => setRoundCount(1)}>
        Roll Initiative
      </Button>
    </Stack>
    <Grid2 container columns={13} spacing={2} p={3}>
      <Grid2 size={6} sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'right' }}>
        {props.encounter.tokens.filter((token) => token.isPlayer).map((token) => (
          <Box key={token.id} onDragStart={() => setDraggingToken(token)} onDragEnd={() => handleDragEnd(token)}>
            <EncounterTokenCard key={token.id} token={token} />
          </Box>))}
      </Grid2>
      <Grid2 size={1} justifyContent={'center'} display={'flex'}>
        <Box sx={{ backgroundColor: '#222', width: '1px', height: '100%' }}></Box>
      </Grid2>
      <Grid2 size={6} sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
        {props.encounter.tokens.filter((token) => !token.isPlayer).map((token) => (
          <Box key={token.id} onDragStart={() => setDraggingToken(token)} onDragEnd={() => handleDragEnd(token)}>
            <EncounterTokenCard token={token} />
          </Box>
        ))}
      </Grid2>
    </Grid2>
  </>;
};
export default EncounterTokenField;