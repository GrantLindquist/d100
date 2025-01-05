'use client';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react';

const SaveContext = createContext<{
  isUnsavedChanges: boolean;
  setUnsavedChanges: Dispatch<SetStateAction<boolean>>;
}>({
  isUnsavedChanges: false,
  setUnsavedChanges: () => {},
});

export const UnsavedChangesProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isUnsavedChanges, setUnsavedChanges] = useState(false);

  return (
    <SaveContext.Provider value={{ isUnsavedChanges, setUnsavedChanges }}>
      {children}
    </SaveContext.Provider>
  );
};

export const useUnsavedChanges = () => {
  const context = useContext(SaveContext);
  if (!context)
    throw new Error(
      'useUnsavedChanges must be used inside UnsavedChangesProvider'
    );
  return context;
};
