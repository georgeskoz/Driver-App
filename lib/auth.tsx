import React, {
createContext,
useCallback,
useContext,
useEffect,
useMemo,
useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppRole = 'user' | 'driver' | 'restaurant' | 'admin';
export type AppLanguage = 'en' | 'fr';

export type AppSession = {
userId: string;
email: string;
firstName: string;
lastName: string;
phone?: string;
profileImage?: string;
role: AppRole;
language: AppLanguage;
};

type AuthContextValue = {
isLoading: boolean;
session: AppSession | null;
isLoggedIn: boolean;
signIn: (session: AppSession) => Promise<void>;
signOut: () => Promise<void>;
updateSession: (partial: Partial<AppSession>) => Promise<void>;
};

const SESSION_STORAGE_KEY = '@transpo_session_v1';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children?: any }) {
const [session, setSession] = useState<AppSession | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
const load = async () => {
try {
const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
if (!raw) return;
const parsed = JSON.parse(raw) as AppSession;
if (parsed?.userId && parsed?.email) {
setSession(parsed);
}
} catch {
// If session is corrupted, ignore and treat as logged out.
} finally {
setIsLoading(false);
}
};

load();
}, []);

const persistSession = useCallback(async (next: AppSession | null) => {
if (!next) {
await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
return;
}
await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
}, []);

const signIn = useCallback(
async (next: AppSession) => {
setSession(next);
await persistSession(next);

// Backwards-compatible keys (used by older parts of the app)
await AsyncStorage.setItem('userEmail', next.email);
await AsyncStorage.setItem('userId', next.userId);
},
[persistSession]
);

const signOut = useCallback(async () => {
setSession(null);
await persistSession(null);
await AsyncStorage.multiRemove(['userEmail', 'userId']);
}, [persistSession]);

const updateSession = useCallback(
async (partial: Partial<AppSession>) => {
setSession((current: AppSession | null) => {
if (!current) return current;
const next = { ...current, ...partial };

// Persist asynchronously (don't block UI)
persistSession(next);
AsyncStorage.setItem('userEmail', next.email);
AsyncStorage.setItem('userId', next.userId);

return next;
});
},
[persistSession]
);

const value: AuthContextValue = useMemo(
() => ({
isLoading,
session,
isLoggedIn: Boolean(session),
signIn,
signOut,
updateSession,
}),
[isLoading, session, signIn, signOut, updateSession]
);

return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
const ctx = useContext(AuthContext);
if (!ctx) throw new Error('useAuth must be used within AuthProvider');
return ctx;
}

// Some parts of the codebase/linting expect a hook named `useAuthActions`.
// Keep this as a thin alias so we don't duplicate auth state logic.
export function useAuthActions() {
  return useAuth();
}