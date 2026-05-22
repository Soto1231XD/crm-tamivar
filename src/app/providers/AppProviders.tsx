import { useEffect, type PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/shared/auth/useAuthStore";
import { getTokenExpirationDate } from "@/shared/auth/token.utils";
import { useThemeStore } from "@/shared/theme/useThemeStore";

function SessionWatcher() {
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      return;
    }

    const expirationDate = getTokenExpirationDate(token);

    if (!expirationDate) {
      logout();
      navigate("/login", { replace: true });
      return;
    }

    const msUntilExpiration = expirationDate.getTime() - Date.now();

    if (msUntilExpiration <= 0) {
      logout();
      navigate("/login", { replace: true });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      logout();
      navigate("/login", { replace: true });
    }, msUntilExpiration);

    return () => window.clearTimeout(timeoutId);
  }, [token, logout, navigate]);

  return null;
}

function ThemeWatcher() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("crm-theme-dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  return (
    <>
      <SessionWatcher />
      <ThemeWatcher />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            background: isDark ? "#0f172a" : "#0F172A",
            color: "#FFFFFF",
            fontSize: "14px",
            border: isDark ? "1px solid rgba(148, 163, 184, 0.18)" : "none",
          },
          success: {
            style: {
              background: isDark ? "#14532d" : "#166534",
            },
          },
          error: {
            style: {
              background: isDark ? "#7f1d1d" : "#991B1B",
            },
          },
        }}
      />
    </>
  );
}
