import type { PropsWithChildren } from 'react';
import { AuthProvider } from '../../shared/context/AuthContext';

export function AppProviders({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}
