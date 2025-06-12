'use client';
import { StickyNote } from '@/types/StickyNote';
import { Box, CircularProgress, Stack } from '@mui/material';
import { default as MinimizeIcon } from '@mui/icons-material/Remove';
import { default as MaximizeIcon } from '@mui/icons-material/CheckBoxOutlineBlank';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { DEFAULT_STICKY_NOTE_DIMENSIONS } from '@/utils/globals';
import { useStickyNotes } from '@/hooks/useStickyNotes';
import { doc, onSnapshot } from '@firebase/firestore';
import db from '@/utils/firebase';
import { useAlert } from '@/hooks/useAlert';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import './ResizeHandleOverride.css';

const StickyNoteComponent = (props: { stickyNoteId: string }) => {

  const { updateStickyNote } = useStickyNotes();
  const { displayAlert } = useAlert();

  const [lastUnsavedEdit, setLastUnsavedEdit] = useState<number | null>(null);
  const [stickyNote, setStickyNote] = useState<StickyNote | null>(null);

  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const saveTimeAllotment = 2000;
  const inBoundsOffset = 100;

  const [initialDimensions, setInitialDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        doc(db, 'stickyNotes', props.stickyNoteId),
        (stickyNoteDocSnap) => {
          if (stickyNoteDocSnap.exists()) {
            const result = stickyNoteDocSnap.data() as StickyNote;
            setStickyNote(result);
            setPosition({
              x: result.position[0],
              y: result.position[1],
            });
          }
        },
      );

      return () => unsubscribe();
    } catch (e: any) {
      displayAlert({
        message: `An error occurred while loading your sticky note.`,
        errorType: e.message,
      });
    }
  }, [props.stickyNoteId]);

  useEffect(() => {
    if (lastUnsavedEdit && stickyNote) {
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

  const iconStyle = {
    fontSize: 16,
    cursor: 'pointer',
  };

  const bind = useDrag(({ first, xy }) => {
    if (stickyNote) {
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
    }
  }, {});

  const updateLocalState = (attr: string, value: any) => {
    if (stickyNote) {
      const newStickyNote = {
        ...stickyNote,
        [attr]: value,
      };
      setStickyNote(newStickyNote);
      setLastUnsavedEdit(Date.now());
    }
  };

  if (!stickyNote || !stickyNote.isDisplayed) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: position?.y ?? 100,
        left: position?.x ?? 20,
      }}
    >
      <ResizableBox
        // @ts-ignore
        id={stickyNote.id}
        width={stickyNote.dimensions[0]}
        height={stickyNote.dimensions[1]}
        minConstraints={[150, 100]}
        onResize={(e: SyntheticEvent, data: any) => {
          const newWidth = Math.max(data.size.width);
          const newHeight = Math.max(data.size.height);

          let newX = position.x;
          let newY = position.y;

          if (data.handle.includes('w')) {
            newX = position.x + (stickyNote!.dimensions[0] - newWidth);
          }
          if (data.handle.includes('n')) {
            newY = position.y + (stickyNote!.dimensions[1] - newHeight);
          }
          setPosition({ x: newX, y: newY });
          updateLocalState('dimensions', [newWidth, newHeight]);
        }}
        axis={stickyNote.isMinimized ? 'x' : 'both'}
        resizeHandles={['se', 'e', 's', 'sw', 'nw', 'n', 'ne', 'w']}
        style={{
          backgroundColor: '#222',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          maxHeight: stickyNote.isMinimized ? 24 : 9999,
        }}
      >
        <Stack
          {...bind()}
          direction="row"
          spacing={0.5}
          px={0.5}
          sx={{
            touchAction: 'none',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              cursor: 'move',
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
          <CloseIcon onClick={() => updateLocalState('isDisplayed', false)} sx={{ fontSize: iconStyle, zIndex: 30 }} />
        </Stack>

        {!stickyNote.isMinimized && (
          <Box sx={{ flexGrow: 1 }}>
        <textarea
          placeholder="Stuff goes here..."
          value={stickyNote.textContent}
          onChange={(event) => updateLocalState('textContent', event.target.value)}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            color: 'white',
            fontSize: '16px',
            resize: 'none',
            border: 'none',
            outline: 'none',
            padding: '8px',
          }}
        />
          </Box>
        )}
      </ResizableBox>
    </div>
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
    {stickyNoteState.map((note) => (
      <div key={note.id} style={{ pointerEvents: 'auto' }}>
        <StickyNoteComponent stickyNoteId={note.id} />
      </div>
    ))}
  </div>;
};

export default StickyNoteContainer;
