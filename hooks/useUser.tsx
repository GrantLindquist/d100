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
import { getUserFromSession, setUserSession } from '@/utils/userSession';
import { User } from '@/types/User';
import { doc, onSnapshot } from '@firebase/firestore';
import db from '@/utils/firebase';

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
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const sessionUser = await getUserFromSession();
      if (sessionUser?.user) {
        const unsubscribe = onSnapshot(
          doc(db, 'users', sessionUser.user.id),
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

  // Listens for changes to user.campaignIds & updates session to be read from middleware
  useEffect(() => {
    const updateSessionCampaignIds = async () => {
      if (user?.campaignIds) {
        await setUserSession(user);
      }
    };
    updateSessionCampaignIds();
  }, [user?.campaignIds]);

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
