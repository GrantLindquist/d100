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
import { getCookie } from '@/utils/cookie';
import { useAlert } from '@/hooks/useAlert';

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
  const { displayAlert } = useAlert();

  const [user, setUser] = useState<User | null>(null);
  const [listening, setListening] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      const result = await getCookie('session');
      if (result?.obj) {
        const unsubscribe = onSnapshot(
          doc(db, 'users', result.obj.id),
          (userDocSnap) => {
            if (userDocSnap.exists()) {
              setUser(userDocSnap.data() as User);
            } else {
              displayAlert({
                message:
                  'Failed to pull user data from database. This may be a result if mismatched database environments.',
                isError: true,
              });
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
