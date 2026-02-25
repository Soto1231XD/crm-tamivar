import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { AppUser, Role } from '../types/rbac';

type AuthContextValue = {
  user: AppUser | null;
  setRoles: (roles: Role[]) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialUser: AppUser = {
  id: 1,
  fullName: 'Usuario Demo',
  email: 'demo@tamivar.com',
  roles: ['SUPER_ADMIN'],
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUser | null>(initialUser);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setRoles: (roles) => {
        setUser((current) => (current ? { ...current, roles } : current));
      },
      logout: () => setUser(null),
    }),
    [user],
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
