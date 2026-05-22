import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AppTheme = "light" | "dark";

const THEME_STORAGE_KEY = "crm-theme";

interface ThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

function resolveInitialTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: resolveInitialTheme(),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === "dark" ? "light" : "dark" }),
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

