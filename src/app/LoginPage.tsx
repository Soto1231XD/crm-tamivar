import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getDefaultDashboardPath } from "@/shared/auth/navigation.util";
import fondoLogin from "@/assets/images/Fondo_login.jpg";
import fondoLogin1 from "@/assets/images/Fondo_login1.jpg";
import fondoLogin2 from "@/assets/images/Fondo_login2.jpg";
import fondoLogin3 from "@/assets/images/Fondo_login3.jpg";
import logoCompleto from "@/assets/images/LOGO_COMPLETO.png";
import { useAuthStore } from "@/shared/auth/useAuthStore";
import { resetPwaApplication } from "@/shared/pwa/pwaRecovery";

const loginBackgrounds = [fondoLogin, fondoLogin1, fondoLogin2, fondoLogin3];

function detectStandaloneMode() {
  if (typeof window === "undefined") return false;

  const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    typeof navigator !== "undefined" &&
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

  return mediaStandalone || iosStandalone;
}

export function LoginPage() {
  const { login, confirmTwoFa, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [correoElectronico, setCorreoElectronico] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [codigo, setCodigo] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [isResettingApp, setIsResettingApp] = useState(false);
  const [isPwaMode, setIsPwaMode] = useState(false);
  const [showPwaNotice, setShowPwaNotice] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setBackgroundIndex((current) => (current + 1) % loginBackgrounds.length);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverflowY = document.body.style.overflowY;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverflowY = document.documentElement.style.overflowY;

    document.body.style.overflow = "auto";
    document.body.style.overflowY = "auto";
    document.documentElement.style.overflow = "auto";
    document.documentElement.style.overflowY = "auto";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overflowY = previousBodyOverflowY;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overflowY = previousHtmlOverflowY;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const syncPwaMode = () => {
      const standaloneMode = detectStandaloneMode();
      setIsPwaMode(standaloneMode);
      setShowPwaNotice(standaloneMode);
    };

    syncPwaMode();
    mediaQuery.addEventListener("change", syncPwaMode);

    return () => mediaQuery.removeEventListener("change", syncPwaMode);
  }, []);

  useEffect(() => {
    if (!isPwaMode || !showPwaNotice) return;

    const timeoutId = window.setTimeout(() => {
      setShowPwaNotice(false);
    }, 6500);

    return () => window.clearTimeout(timeoutId);
  }, [isPwaMode, showPwaNotice]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInfo("");

    try {
      const result = await login({
        correo_electronico: correoElectronico,
        contrasena,
      });

      if (result.status === "requires_2fa") {
        setChallengeId(result.challengeId ?? null);
        setInfo(result.message || "Código de verificación enviado.");
        return;
      }

      const user = useAuthStore.getState().user;
      if (user?.permisos) {
        navigate(getDefaultDashboardPath(user.permisos), { replace: true });
      }
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "No pudimos iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.",
      );
    }
  };

  const handleVerifyTwoFa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!challengeId) return;

    setError("");
    setInfo("");

    try {
      const user = await confirmTwoFa(challengeId, codigo.replace(/\D/g, ""));
      if (user?.permisos) {
        navigate(getDefaultDashboardPath(user.permisos), { replace: true });
        return;
      }

      throw new Error("No pudimos completar el acceso. Intenta nuevamente.");
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : "Código invalido o expirado.",
      );
    }
  };

  const handleResetApplication = async () => {
    setIsResettingApp(true);
    setError("");
    setInfo(
      "Estamos restableciendo la app para limpiar la cache local. Esto tarda solo unos segundos.",
    );

    try {
      useAuthStore.getState().logout();
      await resetPwaApplication();
      window.location.reload();
    } catch {
      setInfo("");
      setError(
        "No pudimos restablecer la app automáticamente. Cierra y vuelve a abrir la aplicación o intenta desde el navegador.",
      );
      setIsResettingApp(false);
    }
  };

  return (
    <div
      className={[
        "grid min-h-screen w-full bg-white lg:h-screen lg:grid-cols-2",
        isPwaMode ? "overflow-y-auto" : "lg:overflow-hidden",
      ].join(" ")}
    >
      {isPwaMode && showPwaNotice ? (
        <div className="fixed left-1/2 top-4 z-50 w-[calc(100vw-2rem)] max-w-[22rem] -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-left shadow-lg backdrop-blur">
          <p className="text-sm font-semibold text-amber-900">
            Esta app requiere internet
          </p>
          <p className="mt-1 pr-8 text-sm leading-6 text-amber-800">
            La PWA necesita conexión para iniciar sesión, guardar cambios y sincronizar la información del CRM.
          </p>
          <button
            type="button"
            onClick={() => setShowPwaNotice(false)}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-base font-semibold leading-none text-amber-700 transition hover:bg-amber-100 hover:text-amber-900"
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      ) : null}

      <aside className="relative min-h-[30vh] sm:min-h-[34vh] lg:h-screen">
        {loginBackgrounds.map((imageSrc, index) => (
          <img
            key={imageSrc}
            src={imageSrc}
            alt="Fondo de acceso CRM TAMIVAR"
            className={[
              "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out",
              backgroundIndex === index ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-center sm:p-6 lg:left-0 lg:right-auto lg:text-left lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-100/90">
            CRM TAMIVAR
          </p>
          <h2 className="mx-auto mt-2 max-w-md text-xl font-black leading-tight text-white sm:text-2xl lg:mx-0 lg:text-3xl">
            Plataforma central para operar equipos y ventas.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs text-slate-200/90 sm:text-sm lg:mx-0">
            Accede con tus credenciales y continua con tu flujo de trabajo según tu rol.
          </p>
        </div>
      </aside>

      <section
        className={[
          "relative flex min-h-[70vh] items-start justify-center bg-white px-5 py-5 sm:px-7 sm:py-6 lg:h-screen lg:items-center lg:py-0",
          isPwaMode ? "overflow-visible pb-12" : "overflow-hidden",
        ].join(" ")}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(25,75,141,0.10),transparent_55%)]" />
        <div className="absolute inset-x-0 top-3 z-10 flex justify-center px-5 sm:top-4 sm:px-7 lg:top-8">
          <div className="flex w-full max-w-sm justify-center">
            <img
              src={logoCompleto}
              alt="Logo Tamivar Inmobiliaria"
              className="h-14 w-auto sm:h-16 lg:h-20"
            />
          </div>
        </div>

        <div className="relative mt-16 w-full max-w-sm text-center sm:mt-18 lg:mt-0 lg:pt-12 lg:text-left">
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            Iniciar sesión
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Ingresa para acceder al CRM TAMIVAR.
          </p>

          {!challengeId ? (
            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <label className="block text-left">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Correo electrónico
                </span>
                <input
                  type="email"
                  required
                  value={correoElectronico}
                  onChange={(event) => setCorreoElectronico(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none ring-brand-700 transition focus:ring"
                />
              </label>

              <label className="block text-left">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Contraseña
                </span>
                <input
                  type="password"
                  required
                  value={contrasena}
                  onChange={(event) => setContrasena(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none ring-brand-700 transition focus:ring"
                />
              </label>

              <button
                type="submit"
                disabled={isLoading || isResettingApp}
                className="w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleVerifyTwoFa}>
              <label className="block text-left">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Código 2FA
                </span>
                <input
                  type="text"
                  required
                  minLength={6}
                  maxLength={6}
                  value={codigo}
                  onChange={(event) =>
                    setCodigo(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none ring-brand-700 transition focus:ring"
                />
              </label>

              <button
                type="submit"
                disabled={isLoading || isResettingApp}
                className="w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Validando..." : "Validar codigo"}
              </button>
            </form>
          )}

          {isPwaMode ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-slate-800">
                Si la aplicación se queda trabada
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Si el acceso no responde o el botón se queda cargando, puedes restablecer la cache local de la app sin borrar tus datos del servidor.
              </p>
              <button
                type="button"
                onClick={handleResetApplication}
                disabled={isLoading || isResettingApp}
                className="mt-3 inline-flex items-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResettingApp
                  ? "Restableciendo app..."
                  : "Restablecer cache de la app"}
              </button>
            </div>
          ) : null}

          {info ? (
            <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
              {info}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
