import { create } from "zustand";
import { persist } from "zustand/middleware";
import { loginApi, verifyTwoFaApi } from "./auth.service";
import type { LoginCredentials, AppUser } from "./interfaces/auth.interface";

interface AuthState {
  user: AppUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Acciones
  login: (
    credentials: LoginCredentials,
  ) => Promise<{ status: string; message?: string; challengeId?: string }>;
  confirmTwoFa: (challengeId: string, code: string) => Promise<AppUser>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const result = await loginApi(credentials);

          if (result.status === "authenticated") {
            set({
              user: result.user,
              token: result.accessToken,
              isAuthenticated: true,
            });
          }
          return result;
        } finally {
          set({ isLoading: false });
        }
      },

      confirmTwoFa: async (challengeId, code) => {
        set({ isLoading: true });
        try {
          const { user, accessToken } = await verifyTwoFaApi(challengeId, code);
          set({
            user,
            token: accessToken,
            isAuthenticated: true,
          });

          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
    },
  ),
);
