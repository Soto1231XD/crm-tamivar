import type { PropsWithChildren } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../../shared/context/AuthContext';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            background: '#0F172A',
            color: '#FFFFFF',
            fontSize: '14px',
          },
          success: {
            style: {
              background: '#166534',
            },
          },
          error: {
            style: {
              background: '#991B1B',
            },
          },
        }}
      />
    </AuthProvider>
  );
}
