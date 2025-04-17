import AddIcon from '@mui/icons-material/Add';
import { Menu, MenuItem } from '@mui/material';
import { Article, Quest } from '@/types/Unit';
import React, { useState } from 'react';
import { doc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import ThemeTrackModal from '@/components/modals/ThemeTrackModal';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { SmallIconButton } from '@/components/buttons/SmallIconButton';

const AddToContentButton = (props: {
  unit: Quest | Article;
  handleAddImage: Function;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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

  return (
    <>
      <SmallIconButton onClick={(event) => setAnchorEl(event.currentTarget)} icon={<AddIcon />} />
      <Menu
        anchorEl={anchorEl}
        open={open}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        onClose={() => setAnchorEl(null)}
      >
        {props.unit.type === 'quest' && (
          <MenuItem onClick={toggleLootTable}>Loot Table</MenuItem>
        )}
        <MenuItem
          onClick={() => {
            props.handleAddImage();
            setAnchorEl(null);
          }}
        >
          Reference Image
        </MenuItem>
        {props.unit.type === 'article' && (
          <MenuItem
            onClick={toggleHasEncounterToken}
          >
            Encounter Token{props.unit.hasEncounterToken && <CheckCircleIcon style={{ marginLeft: 3 }} />}
          </MenuItem>
        )}
        <ThemeTrackModal unitId={props.unit.id} />
      </Menu>
    </>
  );
};
export default AddToContentButton;
