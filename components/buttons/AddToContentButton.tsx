import AddIcon from '@mui/icons-material/Add';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { Article, Quest } from '@/types/Unit';
import React, { useState } from 'react';
import { doc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';

// TODO: Keep scrollbar visible when menu opens
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

  return (
    <>
      <IconButton
        size="large"
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <AddIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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
        <MenuItem disabled onClick={() => setAnchorEl(null)}>
          Theme Track
        </MenuItem>
      </Menu>
    </>
  );
};
export default AddToContentButton;
