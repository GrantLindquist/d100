import { useAlert } from '@/hooks/useAlert';
import React, { ChangeEvent, useState } from 'react';
import { arrayUnion, doc, updateDoc } from '@firebase/firestore';
import { Condition, Encounter, EncounterToken, Initiative } from '@/types/Encounter';
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import db from '@/utils/firebase';

interface EndCondition {
  actor: 'inflicter' | 'inflicted',
  at: 'start' | 'end'
}

const defaultEndCondition: EndCondition = {
  actor: 'inflicted',
  at: 'end',
};

const ConditionsDropdown = (props: {
  encounter: Encounter,
  inflictingToken: EncounterToken,
  inflictedToken: EncounterToken
}) => {
  const [formData, setFormData] = useState({
    conditionName: '',
    roundDuration: 1,
    endCondition: defaultEndCondition,
  });

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent,
  ) => {
    const { name, value } = event.target;

    // Handle nested endCondition updates
    if (name.startsWith('endCondition.')) {
      const key = name.split('.')[1] as 'actor' | 'at';
      setFormData((prev) => ({
        ...prev,
        endCondition: {
          ...prev.endCondition,
          [key]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const calculateConditionEnd = () => {
    const tokenCount = props.encounter.initiativeOrder.length - 1;
    const actorTokenId = formData.endCondition.actor === 'inflicted'
      ? props.inflictedToken.id
      : props.inflictingToken.id;
    const actorTurn = props.encounter.initiativeOrder.findIndex(
      (order) => order.tokenId === actorTokenId,
    );

    const hasTokenTurnPassed = actorTurn <= props.encounter.turnCount;
    let roundEnd = props.encounter.roundCount + formData.roundDuration - (hasTokenTurnPassed ? 0 : 1);

    let turnEnd;
    if (formData.endCondition.at === 'start') {
      turnEnd = actorTurn;
    } else {
      if (actorTurn === tokenCount) {
        roundEnd += 1;
        turnEnd = 0;
      } else {
        turnEnd = actorTurn + 1;
      }
    }

    return {
      roundEnd: roundEnd,
      turnEnd: turnEnd,
    };
  };

  const handleAddCondition = async () => {
    const { roundEnd, turnEnd } = calculateConditionEnd();
    const newCondition: Condition = {
      name: formData.conditionName,

      roundEnd: roundEnd,
      turnEnd: turnEnd,

      roundInflicted: props.encounter.roundCount,
      inflictingTokenId: props.inflictingToken.id,
      inflictedTokenId: props.inflictedToken.id,
    };
    await updateDoc(doc(db, 'units', props.encounter.id), {
      activeConditions: arrayUnion(newCondition),
    });
    setFormData({ conditionName: '', roundDuration: 1, endCondition: defaultEndCondition });
  };

  return (
    <Box width={280}>
      <Stack direction={'row'} spacing={1}>
        <TextField
          name="conditionName"
          variant="outlined"
          size="small"
          fullWidth
          value={formData.conditionName}
          onChange={handleInputChange}
          sx={{
            backgroundColor: '#222222',
            borderRadius: 1,
            color: '#DDDDDD',
            '& fieldset': { border: 'none' },
          }}
          slotProps={{
            input: {
              endAdornment: (
                <IconButton color="primary" size="small" onClick={handleAddCondition}>
                  <AddIcon />
                </IconButton>
              ),
            },
          }}
        />
        <TextField
          name="roundDuration"
          variant="outlined"
          size="small"
          value={formData.roundDuration}
          type="number"
          placeholder="∞"
          onChange={handleInputChange}
          sx={{
            width: '30%',
            backgroundColor: '#222222',
            borderRadius: 1,
            color: '#DDDDDD',
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
      </Stack>
      <Box sx={{ mt: 1 }}>
        <Typography component="span" sx={{ display: 'inline' }}>
          Condition will end at the{' '}
        </Typography>
        <Select
          name="endCondition.at"
          value={formData.endCondition.at}
          onChange={handleInputChange}
          variant="standard"
          disableUnderline
          sx={{
            ml: 0.5,
            color: 'primary.main',
            fontWeight: BOLD_FONT_WEIGHT,
            display: 'inline-block',
            verticalAlign: 'middle',
          }}
        >
          <MenuItem value="start">start</MenuItem>
          <MenuItem value="end">end</MenuItem>
        </Select>
        <Typography component="span" sx={{ display: 'inline', ml: 0.5 }}>
          of
        </Typography>
        <Select
          name="endCondition.actor"
          value={formData.endCondition.actor}
          onChange={handleInputChange}
          variant="standard"
          disableUnderline
          sx={{
            ml: 0.5,
            color: 'primary.main',
            fontWeight: BOLD_FONT_WEIGHT,
            display: 'inline-block',
            verticalAlign: 'middle',
          }}
        >
          <MenuItem value="inflicted">{props.inflictedToken.title}</MenuItem>
          <MenuItem value="inflicter">{props.inflictingToken.title}</MenuItem>
        </Select>
        <Typography component="span" sx={{ display: 'inline', ml: 0.5 }}>
          's turn
        </Typography>
      </Box>

    </Box>
  );
};

const DamageMenu = (props: {
  inflictedTokenId: string;
  inflictingTokenId: string;
  encounter: Encounter;
  closeMenu: Function
}) => {
  const { displayAlert } = useAlert();

  const [healthCounter, setHealthCounter] = useState(0);
  const [applyTempHitPointsChecked, setApplyTempHitPointsChecked] = useState(false);
  const [displayConditionsDropdown, setDisplayConditionsDropdown] = useState(false);

  const inflictedToken = props.encounter.tokens.find((token) => token.id === props.inflictedTokenId);
  const inflictingToken = props.encounter.tokens.find((token) => token.id === props.inflictingTokenId);

  const tickHealth = (direction: -1 | 1) => {
    let temp = healthCounter;
    temp += direction;
    setHealthCounter(temp >= 0 ? temp : 0);
  };

  const handleApplyHitPoints = async (isDamage: boolean) => {
    try {
      let initiativeOrder = props.encounter.initiativeOrder;
      if (inflictedToken) {
        if (isDamage) {
          if (inflictedToken.tempHitPoints > 0) {
            const difference = inflictedToken.tempHitPoints - healthCounter;
            if (difference < 0) {
              inflictedToken.tempHitPoints = 0;
              inflictedToken.currentHitPoints += difference;
            } else {
              inflictedToken.tempHitPoints -= healthCounter;
              inflictedToken.tempHitPoints -= healthCounter;
            }
          } else {
            inflictedToken.currentHitPoints -= healthCounter;
          }
          if (inflictedToken.currentHitPoints <= 0) {
            inflictedToken.currentHitPoints = 0;
            inflictedToken.isDead = true;
            initiativeOrder = initiativeOrder.map((item: Initiative) =>
              item.tokenId === inflictedToken.id
                ? { ...item, isActive: false }
                : item,
            );

          }
        } else {
          if (applyTempHitPointsChecked) {
            if (healthCounter > inflictedToken.tempHitPoints) {
              inflictedToken.tempHitPoints = healthCounter;
            }
          } else {
            if (inflictedToken.isDead) {
              inflictedToken.isDead = false;
              initiativeOrder = initiativeOrder.map((item: Initiative) =>
                item.tokenId === inflictedToken.id
                  ? { ...item, isActive: true }
                  : item,
              );
            }
            if (inflictedToken.currentHitPoints + healthCounter <= inflictedToken.maxHitPoints) {
              inflictedToken.currentHitPoints += healthCounter;
            } else {
              inflictedToken.currentHitPoints = inflictedToken.maxHitPoints;
            }
          }
        }

        const newTokens = props.encounter.tokens.map((token: EncounterToken) =>
          token.id === inflictedToken.id ? inflictedToken : token,
        );
        await updateDoc(doc(db, 'units', props.encounter.id), {
          tokens: newTokens,
          initiativeOrder: initiativeOrder,
        });
      } else {
        displayAlert({
          message: 'Unable to locate inflicted token in encounter document.',
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
             width: '300px',
             justifyContent: 'space-between',
           }}>
      <IconButton onClick={() => tickHealth(1)}>
        <AddIcon />
      </IconButton>
      <TextField
        variant="outlined"
        size="small"
        value={healthCounter.toString()}
        type="number"
        onChange={(event) => {
          const value = Number(event.target.value);
          if (value < 0) {
            setHealthCounter(0);
          } else if (value <= 999) {
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
            fontSize: 30,
          },
        }}
      />
      <IconButton onClick={() => tickHealth(-1)}>
        <RemoveIcon />
      </IconButton>
    </Stack>
    <Stack direction={'row'} spacing={.5} py={.5}>
      <Button variant="contained" onClick={() => handleApplyHitPoints(false)}
              sx={{ width: '50%', color: 'white', backgroundColor: 'green' }}>
        Heal
      </Button>
      <Button variant="contained" onClick={() => handleApplyHitPoints(true)}
              sx={{ width: '50%', color: 'white', backgroundColor: 'red' }}>
        Damage
      </Button>
    </Stack>
    <Box px={.5}>
      <Stack direction={'row'} alignItems={'center'}>
        <Stack direction={'row'} alignItems={'center'}
               onClick={() => setDisplayConditionsDropdown(!displayConditionsDropdown)} sx={{ cursor: 'pointer' }}
               flexGrow={1}>
          <Typography>Conditions</Typography>
          {displayConditionsDropdown ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </Stack>
        <Stack direction={'row'} alignItems={'center'}>
          <Typography>
            Temp HP
          </Typography>
          <Checkbox
            checked={applyTempHitPointsChecked}
            onChange={(event) => setApplyTempHitPointsChecked(event.target.checked)}
          />
        </Stack>
      </Stack>
      {displayConditionsDropdown && inflictedToken && inflictingToken && <>
        <ConditionsDropdown encounter={props.encounter} inflictingToken={inflictingToken}
                            inflictedToken={inflictedToken} />
      </>}
    </Box>
  </Box>;
};

export default DamageMenu;