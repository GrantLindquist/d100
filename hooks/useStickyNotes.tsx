'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useCampaign } from '@/hooks/useCampaign';
import { StickyNote } from '@/types/StickyNote';
import { useAlert } from '@/hooks/useAlert';
import {
  arrayRemove,
  arrayUnion,
  collection,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  where,
} from '@firebase/firestore';
import { doc } from 'firebase/firestore';
import db from '@/utils/firebase';
import { generateUUID } from '@/utils/uuid';
import { DEFAULT_STICKY_NOTE_DIMENSIONS } from '@/utils/globals';

const StickyNoteContext = createContext<{
  stickyNoteState: StickyNote[];
  updateStickyNote: Function;
  handleAddStickyNote: Function;
  handleDeleteStickyNote: Function;
}>({
  stickyNoteState: [],
  updateStickyNote: async () => {
  },
  handleAddStickyNote: async () => {
  },
  handleDeleteStickyNote: async () => {
  },
});

export const StickyNoteProvider = ({ children }: { children: ReactNode }) => {

  const { campaign } = useCampaign();
  const { displayAlert } = useAlert();

  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);

  useEffect(() => {
    try {
      if (campaign?.stickyNoteIds) {
        const q = query(collection(db, 'stickyNotes'), where('id', 'in', campaign.stickyNoteIds));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          let stickyNotes: StickyNote[] = [];
          querySnapshot.forEach((doc) => {
            stickyNotes.push(doc.data() as StickyNote);
          });
          setStickyNotes(stickyNotes);
        });
        return () => unsubscribe();
      }
    } catch (e: any) {
      displayAlert({
        message: 'oops',
        errorType: e.message,
      });
    }
  }, [campaign?.stickyNoteIds]);

  const updateStickyNote = async (note: StickyNote) => {
    try {
      await setDoc(doc(db, 'stickyNotes', note.id), note);
    } catch (e: any) {
      displayAlert({
        message: 'An error occurred while saving changes to your sticky notes.',
        errorType: e.message,
      });
    }
  };

  const handleAddStickyNote = async () => {
    try {
      const noteId = generateUUID();
      const newStickyNote: StickyNote = {
        id: noteId,
        textContent: '',
        isDisplayed: true,
        isMinimized: false,
        position: [0, 0],
        dimensions: DEFAULT_STICKY_NOTE_DIMENSIONS,
      };
      await runTransaction(db, async (transaction) => {
        transaction.set(doc(db, 'stickyNotes', noteId), newStickyNote);
        transaction.update(doc(db, 'campaigns', campaign!.id), {
          stickyNoteIds: arrayUnion(noteId),
        });
      });
    } catch (e: any) {
      displayAlert({
        message: 'An error occurred while saving adding your new sticky note.',
        errorType: e.message,
      });
    }
  };

  const handleDeleteStickyNote = async (id: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        transaction.delete(doc(db, 'stickyNotes', id));
        transaction.update(doc(db, 'campaigns', campaign!.id), {
          stickyNoteIds: arrayRemove(id),
        });
      });
    } catch (e: any) {
      displayAlert({
        message: 'An error occurred while deleting your sticky note.',
        errorType: e.message,
      });
    }
  };

  return (
    <StickyNoteContext.Provider
      value={{
        stickyNoteState: stickyNotes,
        updateStickyNote,
        handleAddStickyNote,
        handleDeleteStickyNote,
      }}
    >
      {children}
    </StickyNoteContext.Provider>
  );
};

export const useStickyNotes = () => {
  const context = useContext(StickyNoteContext);
  if (!context)
    throw new Error('useStickyNotes must be used inside StickyNoteProvider');
  return context;
};
