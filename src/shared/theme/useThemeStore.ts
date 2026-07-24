import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AppTheme = "light" | "dark";

const THEME_STORAGE_KEY = "crm-theme";

interface ThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light" as AppTheme,
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

