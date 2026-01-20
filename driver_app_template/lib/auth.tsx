import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DriverAppRole = 'driver' | 'admin';

export type DriverAppSession = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  role: DriverAppRole;
};

type AuthContextValue = {
  isLoading: boolean;
  session: DriverAppSession | null;
  isLoggedIn: boolean;
  signIn: (session: DriverAppSession) => Promise<void>;
  signOut: () => Promise<void>;
};

const SESSION_STORAGE_KEY = '@transpo_drivers_session_v1';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children?: any }) {
  const [session, setSession] = useState<DriverAppSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as DriverAppSession;
        if (parsed?.userId && parsed?.email) {
          setSession(parsed);
        }
      } catch {
        // ignore corrupted session
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const signIn = useCallback(async (next: DriverAppSession) => {
    setSession(next);
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      isLoading,
      session,
      isLoggedIn: Boolean(session),
      signIn,
      signOut,
    }),
    [isLoading, session, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useDriverAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useDriverAuth must be used within AuthProvider');
  return ctx;
}