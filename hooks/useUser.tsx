'use client';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { User } from '@/types/User';
import { doc, onSnapshot } from '@firebase/firestore';
import db from '@/utils/firebase';
import { getUserFromSession } from '@/utils/userSession';

const UserContext = createContext<{
  user: User | null;
  setListening: Dispatch<SetStateAction<boolean>>;
  signOutUser: () => void;
}>({
  user: null,
  setListening: () => {},
  signOutUser: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // TODO: Figure out a better way to do this
  const [listening, setListening] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      const result = await getUserFromSession();
      if (result?.user || listening) {
        const unsubscribe = onSnapshot(
          doc(db, 'users', result.user.id),
          (userDocSnap) => {
            if (userDocSnap.exists()) {
              setUser(userDocSnap.data() as User);
            }
          }
        );
        return () => {
          unsubscribe();
        };
      }
    };
    fetchUser();
  }, [listening]);

  const signOutUser = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, signOutUser, setListening }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used inside UserProvider');
  return context;
};
