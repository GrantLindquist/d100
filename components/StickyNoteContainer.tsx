'use client';
import { StickyNote } from '@/types/StickyNote';
import { Box, CircularProgress, Paper, Stack } from '@mui/material';
import { default as MinimizeIcon } from '@mui/icons-material/Remove';
import { default as MaximizeIcon } from '@mui/icons-material/CheckBoxOutlineBlank';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { DEFAULT_STICKY_NOTE_DIMENSIONS } from '@/utils/globals';
import { useStickyNotes } from '@/hooks/useStickyNotes';

// TODO: Make this resizable from all sides
const StickyNoteComponent = (props: { stickyNote: StickyNote }) => {

  const { updateStickyNote } = useStickyNotes();
  const [lastUnsavedEdit, setLastUnsavedEdit] = useState<number | null>(null);
  const [stickyNote, setStickyNote] = useState<StickyNote>(props.stickyNote);

  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const saveTimeAllotment = 4000;
  const inBoundsOffset = 100;

  useEffect(() => {
    if (lastUnsavedEdit) {
      const interval = setTimeout(function() {
        if (Date.now() > lastUnsavedEdit + saveTimeAllotment) {
          const {
            width,
            height,
          } = document.getElementById(stickyNote.id)?.getBoundingClientRect() ?? {
            width: DEFAULT_STICKY_NOTE_DIMENSIONS[0],
            height: DEFAULT_STICKY_NOTE_DIMENSIONS[1],
          };
          updateStickyNote({
            ...stickyNote,
            dimensions: [width, height],
            position: [position.x, position.y],
          });
          setLastUnsavedEdit(null);
        }
      }, saveTimeAllotment);

      return () => clearTimeout(interval);
    }
  }, [lastUnsavedEdit]);

  useEffect(() => {
    setStickyNote(props.stickyNote);
    setPosition({
      x: props.stickyNote.position[0],
      y: props.stickyNote.position[1],
    });
  }, [props.stickyNote]);

  const iconStyle = {
    fontSize: 16,
    cursor: 'pointer',
  };

  const bind = useDrag(({ first, xy }) => {
    const [pointerX, pointerY] = xy;

    const rect = document.getElementById(stickyNote.id)?.getBoundingClientRect();
    if (rect) {
      if (first) {
        dragOffset.current = {
          x: pointerX - rect.left,
          y: pointerY - rect.top,
        };
      }
      setLastUnsavedEdit(Date.now());
      const posX = pointerX - dragOffset.current.x;
      const posY = pointerY - dragOffset.current.y;
      const inBoundsX = posX > 0 && (posX < window.innerWidth - rect.width + inBoundsOffset);
      const inBoundsY = posY > 0 && (posY < window.innerHeight - rect.height + inBoundsOffset);
      setPosition({
        x: inBoundsX ? posX : position.x,
        y: inBoundsY ? posY : position.y,
      });
    }
  }, {});

  const updateLocalState = (attr: string, value: any) => {
    const newStickyNote = {
      ...stickyNote,
      [attr]: value,
    };
    setStickyNote(newStickyNote);
    setLastUnsavedEdit(Date.now());
  };

  if (!stickyNote.isDisplayed) {
    return null;
  }
  return (
    <Paper
      id={stickyNote.id}
      sx={{
        width: stickyNote.dimensions[0],
        height: stickyNote.dimensions[1],
        maxHeight: stickyNote.isMinimized ? 24 : 9999,
        minWidth: 150,
        minHeight: stickyNote.isMinimized ? 24 : 100,
        position: 'absolute',
        top: position?.y ?? 100,
        left: position?.x ?? 20,
        pointerEvents: 'fill',
        resize: stickyNote.isMinimized ? 'none' : 'both',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        direction="row"
        spacing={0.5}
        px={0.5}
        sx={{
          height: '24px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          {...bind()}
          style={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: iconStyle }} />
          {lastUnsavedEdit && Date.now() < lastUnsavedEdit + saveTimeAllotment &&
            <CircularProgress size={'10px'} color={'inherit'} sx={{ marginLeft: .5 }} />}
        </div>
        {stickyNote.isMinimized ? (
          <MaximizeIcon onClick={() => updateLocalState('isMinimized', false)} sx={{ fontSize: iconStyle }} />
        ) : (
          <MinimizeIcon onClick={() => updateLocalState('isMinimized', true)} sx={{ fontSize: iconStyle }} />
        )}
        <CloseIcon onClick={() => updateLocalState('isDisplayed', false)} sx={{ fontSize: iconStyle }} />
      </Stack>

      {!stickyNote.isMinimized && (
        <Box sx={{ flexGrow: 1 }}>
        <textarea
          placeholder="Stuff goes here..."
          value={stickyNote.textContent}
          onChange={(event) => updateLocalState('textContent', event.target.value)}
          style={{
            resize: 'none',
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            color: 'white',
            fontSize: '16px',
            border: 'none',
            outline: 'none',
            padding: '8px',
          }}
        />
        </Box>
      )}
    </Paper>
  );
};

const StickyNoteContainer = () => {
  const { stickyNoteState } = useStickyNotes();

  return <div style={{
    position: 'fixed',
    top: 0,
    zIndex: 99,
    height: '100vh',
    width: '100vw',
    pointerEvents: 'none',
  }}>
    {stickyNoteState.map((note) => <StickyNoteComponent key={note.id} stickyNote={note} />)}
  </div>;
};

export default StickyNoteContainer;
