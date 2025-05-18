import { useState } from 'react';
import { IconButton, Menu, MenuItem, Stack, Tooltip, Typography } from '@mui/material';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import { useStickyNotes } from '@/hooks/useStickyNotes';

const StickyNoteButton = () => {
  const { stickyNoteState, updateStickyNote, handleAddStickyNote, handleDeleteStickyNote } = useStickyNotes();

  const [anchor, setAnchor] = useState(null);
  const [hoveredStickyNoteId, setHoveredStickyNoteId] = useState<string | null>(null);

  const iconStyle = {
    fontSize: '18px',
    cursor: 'pointer',
    color: 'grey',
  };

  const handleClick = (event: any) => {
    setAnchor(event.currentTarget);
  };

  return (
    <>
      <Tooltip title={'Sticky Notes'}>
        <IconButton onClick={handleClick}>
          <StickyNote2Icon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        {stickyNoteState.map((note) =>
          <Stack
            key={note.id}
            direction={'row'}
            spacing={1}
            onMouseEnter={() => setHoveredStickyNoteId(note.id)}
            onMouseLeave={() => setHoveredStickyNoteId(null)}
            sx={{
              pl: 3,
              pr: 1.5,
              alignItems: 'center',
            }}>
            <Typography
              sx={{
                flexGrow: 2,
                maxWidth: '250px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>{note.textContent.trim() ? note.textContent : 'untitled'}&nbsp;</Typography>
            <div style={{
              visibility: hoveredStickyNoteId === note.id ? 'visible' : 'hidden',
              alignContent: 'center',
              justifyContent: 'right',
              display: 'flex',
              gap: 4,
            }}>
              <VisibilityOffIcon style={iconStyle} onClick={() => updateStickyNote({
                ...note,
                isDisplayed: !note.isDisplayed,
              })} />
              <DeleteIcon style={iconStyle} onClick={() => handleDeleteStickyNote(note.id)} />
            </div>
          </Stack>,
        )}
        <MenuItem onClick={() => handleAddStickyNote()}>
          <AddIcon />
          &nbsp;Add Sticky Note
        </MenuItem>
      </Menu>
    </>
  );
};
export default StickyNoteButton;
