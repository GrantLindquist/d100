'use client';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';

const SettingsButton = () => {
  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);

  const handleClick = (event: any) => {
    setAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
  };

  return (
    <>
      <IconButton onClick={handleClick}>
        <SettingsIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={open} onClose={handleClose}>
        <MenuItem>Manage players</MenuItem>
      </Menu>
    </>
  );
};

export default SettingsButton;
