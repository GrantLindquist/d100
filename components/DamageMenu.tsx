import { useAlert } from '@/hooks/useAlert';
import { ChangeEvent, useState } from 'react';
import { arrayUnion, doc, updateDoc } from '@firebase/firestore';
import { Condition, Encounter, EncounterToken } from '@/types/Encounter';
import { Box, Button, Checkbox, IconButton, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import db from '@/utils/firebase';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ThemeTooltip from '@/components/ThemeTooltip';

const ConditionsDropdown = (props: { encounter: Encounter, inflictedToken: EncounterToken }) => {
  const [formData, setFormData] = useState({
    conditionName: '',
    roundDuration: 0,
    removeOnEnemyTurn: false,
  });

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddCondition = async () => {
    const newCondition: Condition = {
      name: formData.conditionName,
      roundDuration: Number(formData.roundDuration),
      removeOnEnemyTurn: formData.removeOnEnemyTurn,
      roundInflicted: props.encounter.roundCount,
      inflictedTokenId: props.inflictedToken.id,
    };
    await updateDoc(doc(db, 'units', props.encounter.id), {
      activeConditions: arrayUnion(newCondition),
    });
    setFormData({ conditionName: '', roundDuration: 0, removeOnEnemyTurn: false });
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
        />
        <TextField
          variant="outlined"
          name="roundDuration"
          size="small"
          value={formData.roundDuration}
          type="number"
          placeholder={'∞'}
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
      <Stack direction={'row'} spacing={1}>
        <Stack direction={'row'} spacing={1} alignItems={'center'} flexGrow={1}>
          <ThemeTooltip
            title={`If checked, this condition will end after the enemy's turn as opposed to ending after yours.`}
          >
            <InfoOutlinedIcon sx={{ color: 'grey', height: 20, width: 20 }} />
          </ThemeTooltip>
          <Typography variant={'subtitle2'}>{'End on enemy\'s turn'}</Typography>
          <Checkbox
            name="removeOnEnemyTurn"
            checked={formData.removeOnEnemyTurn}
            onChange={handleInputChange}
          />
        </Stack>
        <Button variant={'contained'} size={'small'} onClick={() => handleAddCondition()}>
          <AddIcon />
        </Button>
      </Stack>
    </Box>
  );
};

const DamageMenu = (props: { inflictedTokenId: string; encounter: Encounter; closeMenu: Function }) => {
  const { displayAlert } = useAlert();

  const [healthCounter, setHealthCounter] = useState(0);
  const [applyTempHitPointsChecked, setApplyTempHitPointsChecked] = useState(false);
  const [displayConditionsDropdown, setDisplayConditionsDropdown] = useState(false);

  const inflictedToken = props.encounter.tokens.find((token) => token.id === props.inflictedTokenId);

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
            }
          } else {
            inflictedToken.currentHitPoints -= healthCounter;
          }
          if (inflictedToken.currentHitPoints <= 0) {
            inflictedToken.currentHitPoints = 0;
            inflictedToken.isDead = true;
            // TODO: Make this an object with an active:boolean property to maintain initiative state
            initiativeOrder = initiativeOrder.filter((id: string) => id !== inflictedToken.id);
          }
        } else {
          if (applyTempHitPointsChecked) {
            if (healthCounter > inflictedToken.tempHitPoints) {
              inflictedToken.tempHitPoints = healthCounter;
            }
          } else {
            if (inflictedToken.isDead) {
              inflictedToken.isDead = false;
              initiativeOrder.push(inflictedToken.id);
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
      {displayConditionsDropdown && inflictedToken && <>
        <ConditionsDropdown encounter={props.encounter} inflictedToken={inflictedToken} />
      </>}
    </Box>

  </Box>;
};

export default DamageMenu;