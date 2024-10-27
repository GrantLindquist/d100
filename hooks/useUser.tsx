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
  const [listening, setListening] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      console.log('getting user from session...');
      const result = await getUserFromSession();
      console.log('Testing redeployment');
      if (result?.user) {
        console.log(result?.user);
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
      } else {
        console.log('could not retrieve user from session.');
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
