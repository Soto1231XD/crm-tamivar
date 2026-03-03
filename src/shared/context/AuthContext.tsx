import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { loginApi, verifyTwoFaApi } from '../../modules/auth/services/auth.api';
import type { AppUser, LoginCredentials } from '../types/rbac';

type AuthContextValue = {
  user: AppUser | null;
  accessToken: string | null;
  loginWithPassword: (credentials: LoginCredentials) => Promise<
    | {
        status: 'authenticated';
        user: AppUser;
      }
    | {
        status: 'requires_2fa';
        challengeId: string;
        message: string;
      }
  >;
  verifyTwoFa: (challengeId: string, codigo: string) => Promise<AppUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type SessionState = {
  user: AppUser | null;
  accessToken: string | null;
};

const STORAGE_KEY = 'crm_tamivar_session';

function loadInitialSession(): SessionState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { user: null, accessToken: null };
  }

  try {
    const parsed = JSON.parse(raw) as SessionState;
    return {
      user: parsed.user ?? null,
      accessToken: parsed.accessToken ?? null,
    };
  } catch {
    return { user: null, accessToken: null };
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionState>(() => loadInitialSession());

  const setAuthenticatedSession = (user: AppUser, accessToken: string) => {
    const nextSession = { user, accessToken };
    setSession(nextSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.user,
      accessToken: session.accessToken,
      loginWithPassword: async (credentials) => {
        const result = await loginApi(credentials);

        if (result.status === 'requires_2fa') {
          return result;
        }

        setAuthenticatedSession(result.user, result.accessToken);
        return { status: 'authenticated', user: result.user };
      },
      verifyTwoFa: async (challengeId, codigo) => {
        const result = await verifyTwoFaApi(challengeId, codigo);
        setAuthenticatedSession(result.user, result.accessToken);
        return result.user;
      },
      logout: () => {
        setSession({ user: null, accessToken: null });
        localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [session.accessToken, session.user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
