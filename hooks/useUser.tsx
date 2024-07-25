'use client';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getUserFromSession } from '@/utils/userSession';
import { UserSession } from '@/types/User';

const UserContext = createContext<{
  user: UserSession | null;
  fetchUser: () => void;
}>({
  user: null,
  fetchUser: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  // TODO: Potentially remove fetchUser from hook
  const fetchUser = async () => {
    const session = await getUserFromSession();
    const sessionUser = session?.user || null;
    if (sessionUser) {
      setUser({
        displayName: sessionUser.displayName,
        email: sessionUser.email,
        photoURL: sessionUser.photoURL,
        id: sessionUser.id,
      });
    }
  };

  return (
    <UserContext.Provider value={{ user, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used inside UserProvider');
  return context;
};
