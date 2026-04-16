import { useEffect, type PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/shared/auth/useAuthStore";
import { getTokenExpirationDate } from "@/shared/auth/token.utils";

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

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <>
      <SessionWatcher />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "12px",
            background: "#0F172A",
            color: "#FFFFFF",
            fontSize: "14px",
          },
          success: {
            style: {
              background: "#166534",
            },
          },
          error: {
            style: {
              background: "#991B1B",
            },
          },
        }}
      />
    </>
  );
}
