'use client';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getUserFromSession } from '@/utils/userSession';
import { User } from '@/types/User';

const UserContext = createContext<{
  user: User | null;
  fetchUser: () => void;
  signOutUser: () => void;
}>({
  user: null,
  fetchUser: () => {},
  signOutUser: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  // Retrieves session data and sets user state for UserProvider
  const fetchUser = async () => {
    const session = await getUserFromSession();
    const sessionUser = session?.user || null;
    if (sessionUser) {
      setUser(sessionUser);
    }
  };

  const signOutUser = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, fetchUser, signOutUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used inside UserProvider');
  return context;
};
