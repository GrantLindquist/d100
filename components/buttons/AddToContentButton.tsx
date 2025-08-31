import AddIcon from '@mui/icons-material/Add';
import { Menu, MenuItem, Stack, TextField, Typography, useTheme } from '@mui/material';
import { Article, Quest } from '@/types/Unit';
import { useState } from 'react';
import { doc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import ThemeTrackModal from '@/components/modals/ThemeTrackModal';
import { SmallIconButton } from '@/components/buttons/SmallIconButton';
import ImageIcon from '@mui/icons-material/Image';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TollIcon from '@mui/icons-material/Toll';

const AddToContentButton = (props: {
  unit: Quest | Article;
  handleAddImage: Function;
}) => {
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const [defaultTokenHp, setDefaultTokenHp] = useState<number>(props.unit.encounterTokenDefaultHP ?? 0);

  const toggleLootTable = async () => {
    await updateDoc(doc(db, 'units', props.unit.id), {
      // @ts-ignore
      loot: props.unit.loot ? null : [],
    });
    setAnchorEl(null);
  };

  const toggleHasEncounterToken = async () => {
    await updateDoc(doc(db, 'units', props.unit.id), {
      // @ts-ignore
      hasEncounterToken: !props.unit.hasEncounterToken,
    });
  };

  const handleSaveDefaultTokenHP = async () => {
    await updateDoc(doc(db, 'units', props.unit.id), {
      encounterTokenDefaultHP: defaultTokenHp,
    });
  };

  return (
    <>
      <SmallIconButton onClick={(event) => setAnchorEl(event.currentTarget)} icon={<AddIcon />} />
      <Menu
        anchorEl={anchorEl}
        open={open}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        onClose={() => {
          if (props.unit.hasEncounterToken && props.unit.encounterTokenDefaultHP !== defaultTokenHp) {
            handleSaveDefaultTokenHP();
          }
          setAnchorEl(null);
        }}
      >
        {props.unit.type === 'quest' && (
          <MenuItem onClick={toggleLootTable}>
            <TollIcon sx={{ width: 20, height: 20 }} />
            &nbsp; Loot Table</MenuItem>
        )}
        <MenuItem
          onClick={() => {
            props.handleAddImage();
            setAnchorEl(null);
          }}
        >
          <ImageIcon sx={{ width: 20, height: 20 }} />
          &nbsp; Reference Image
        </MenuItem>
        {props.unit.type === 'article' && (
          <>
            <MenuItem
              onClick={toggleHasEncounterToken}
            >
              <AccountCircleIcon sx={{
                width: 20,
                height: 20,
                color: props.unit.hasEncounterToken ? theme.palette.primary.main : 'white',
              }} />
              &nbsp; Encounter Token
            </MenuItem>
            {props.unit.hasEncounterToken &&
              <Stack direction={'row'} px={3} alignItems={'center'} spacing={1.5}>
                <Typography sx={{ color: 'grey', fontSize: 11, lineHeight: 1.2 }}>
                  Default{<br />}Hit Points
                </Typography>
                <TextField
                  variant="outlined"
                  value={Number(defaultTokenHp).toString()}
                  type="number"
                  onChange={(event) => {
                    const input = event.target.value;
                    const value = parseInt(input, 10);
                    if (isNaN(value) || value < 0) {
                      setDefaultTokenHp(0);
                    } else if (value <= 999) {
                      setDefaultTokenHp(value);
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#222',
                      padding: 0,
                      minHeight: 'unset',
                      width: 55,
                    },
                    '& fieldset': {
                      border: 'none',
                    },
                    '& .MuiInputBase-input': {
                      textAlign: 'center',
                      padding: .5,
                      fontSize: 14,
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
            }
          </>
        )}
        <ThemeTrackModal unitId={props.unit.id} />
      </Menu>
    </>
  );
};
export default AddToContentButton;
