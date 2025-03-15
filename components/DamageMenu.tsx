import { useAlert } from '@/hooks/useAlert';
import { usePathname } from 'next/navigation';
import { getCurrentUnitIdFromUrl } from '@/utils/url';
import { useState } from 'react';
import { doc, getDoc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { EncounterToken } from '@/types/Encounter';
import { Box, Button, Checkbox, IconButton, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const ConditionsDropdown = (props: { inflictedTokenId: string; unitId: string }) => {

  return <>


  </>;
};

const DamageMenu = (props: { inflictedTokenId: string; closeMenu: Function }) => {
  const { displayAlert } = useAlert();
  const pathname = usePathname();
  const unitId = getCurrentUnitIdFromUrl(pathname.split('/').slice(1));

  const [healthCounter, setHealthCounter] = useState(0);
  const [applyTempHitPointsChecked, setApplyTempHitPointsChecked] = useState(false);
  const [displayConditionsDropdown, setDisplayConditionsDropdown] = useState(false);

  const tickHealth = (direction: -1 | 1) => {
    let temp = healthCounter;
    temp += direction;
    setHealthCounter(temp >= 0 ? temp : 0);
  };

  const handleApplyHitPoints = async (isDamage: boolean) => {
    try {
      const encounterDocRef = doc(db, 'units', unitId!);
      const encounterDoc = await getDoc(encounterDocRef);
      if (encounterDoc.exists()) {
        const tokens = encounterDoc.data().tokens;
        let initiativeOrder = encounterDoc.data().initiativeOrder as string[];
        const inflictedToken = tokens.find((token: EncounterToken) => token.id === props.inflictedTokenId) as EncounterToken;
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
              inflictedToken.currentHitPoints += healthCounter;
            }
          }

          const newTokens = tokens.map((token: EncounterToken) =>
            token.id === inflictedToken.id ? inflictedToken : token,
          );
          await updateDoc(encounterDocRef, {
            tokens: newTokens,
            initiativeOrder: initiativeOrder,
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
             width: '250px',
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
    {displayConditionsDropdown && unitId && <>
      <ConditionsDropdown inflictedTokenId={props.inflictedTokenId} unitId={unitId} />
    </>}
  </Box>;
};

export default DamageMenu;