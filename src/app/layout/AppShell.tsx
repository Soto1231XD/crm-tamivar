import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "@/shared/auth/useAuthStore";
import {
  getAvailableModules,
  MODULE_LABELS,
} from "@/shared/auth/navigation.util";
import type { ModuleKey } from "@/shared/auth/interfaces/rbac.interface";
import dashboardIcon from "@/assets/images/Dashboard.png";
import propiedadesIcon from "@/assets/images/Propiedades.png";
import registrosIcon from "@/assets/images/Registro.png";
import contenidoIcon from "@/assets/images/Contenido.png";
import usuariosIcon from "@/assets/images/Usuarios.png";
import rolIcon from "@/assets/images/Rol.png";
import logsIcon from "@/assets/images/Logs.png";
import MenuIcon from "@/assets/images/Menu.png";
import LogoutIcon from "@/assets/images/Logout.png";
import logoBlanco from "@/assets/images/logo_blanco.png";

const MODULE_ICONS: Record<ModuleKey, string> = {
  dashboard: dashboardIcon,
  propiedades: propiedadesIcon,
  registros: registrosIcon,
  blogs: contenidoIcon,
  usuarios: usuariosIcon,
  roles: rolIcon,
  movimientos: logsIcon,
};

export function AppShell() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const permissions = user?.permisos ?? [];
  const availableModules = getAvailableModules(permissions);

  const navItems: Array<{ to: string; label: string; icon: string }> =
    availableModules.map((module: ModuleKey) => ({
      to: module === "dashboard" ? "/dashboard" : `/modulos/${module}`,
      label: MODULE_LABELS[module] || module,
      icon: MODULE_ICONS[module],
    }));

  const primaryRoleDisplay = user?.roles?.[0] || "Sin rol asignado";
  const pageTitle = getPageTitle(location.pathname);
  const displayName = user
    ? `${user.nombres || ""} ${user.apellido_paterno || ""}`.trim() ||
      user.correo_electronico
    : "Usuario";

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="flex h-full w-full">
        {!isSidebarCollapsed && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/45 md:hidden"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800/80 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] text-slate-100 transition-all duration-300 md:relative",
            isSidebarCollapsed
              ? "-translate-x-full md:translate-x-0 md:w-[92px] md:px-3 md:py-5"
              : "w-[282px] translate-x-0 px-4 py-5 md:w-[264px] md:px-5 md:py-6",
          ].join(" ")}
        >
          <div
            className={
              isSidebarCollapsed ? "flex justify-center" : "flex justify-between"
            }
          >
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3">
                <img
                  src={logoBlanco}
                  alt="Logo Tamivar"
                  className="h-11 w-auto shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    CRM TAMIVAR
                  </p>
                  <h2 className="truncate text-lg font-bold tracking-tight text-white">
                    Panel
                  </h2>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-white/5 text-slate-200 transition hover:bg-white/10"
            >
              <img src={MenuIcon} alt="Menu" className="h-5 w-5 shrink-0" />
            </button>
          </div>

          <nav className="crm-scrollbar-hidden mt-8 flex flex-1 flex-col gap-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() =>
                  window.innerWidth < 768 && setIsSidebarCollapsed(true)
                }
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-2xl text-sm transition-all duration-200",
                    isSidebarCollapsed
                      ? "justify-center px-2 py-3.5"
                      : "px-3.5 py-3",
                    isActive
                      ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  ].join(" ")
                }
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/6 transition group-hover:bg-white/10">
                  <img src={item.icon} alt="" className="h-5 w-5 shrink-0" />
                </span>
                {!isSidebarCollapsed && (
                  <span className="truncate font-medium">{item.label}</span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-4 pt-4">
            {!isSidebarCollapsed && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="truncate text-sm font-semibold text-white">
                  {displayName}
                </p>
                <p className="mt-1 text-xs text-slate-400">{primaryRoleDisplay}</p>
              </div>
            )}

            <button
              type="button"
              onClick={logout}
              className={[
                "inline-flex w-full items-center justify-center rounded-2xl border border-red-500/60 bg-red-600 font-semibold text-white shadow-sm transition hover:bg-red-700",
                isSidebarCollapsed
                  ? "h-11 px-2 py-3"
                  : "gap-2 px-3 py-3 text-sm",
              ].join(" ")}
            >
              <img src={LogoutIcon} alt="Logout" className="h-5 w-5 shrink-0" />
              {!isSidebarCollapsed && <span>Cerrar sesión</span>}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
                >
                  <img
                    src={MenuIcon}
                    alt="Abrir menú"
                    className="h-5 w-5 brightness-0"
                  />
                </button>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Vista actual
                  </p>
                  <h1 className="truncate text-xl font-black tracking-tight text-slate-950">
                    {pageTitle}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-900 text-sm font-bold text-white shadow-sm">
                  {user?.foto_url ? (
                    <img
                      src={user.foto_url}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {`${user?.nombres?.[0] || ""}${user?.apellido_paterno?.[0] || ""}`.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-slate-900">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-500">{primaryRoleDisplay}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-4 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="min-h-0"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";

  if (pathname.startsWith("/modulos/")) {
    const rawModule = pathname
      .replace("/modulos/", "")
      .split("/")[0] as ModuleKey;
    return MODULE_LABELS[rawModule] ?? "Módulo";
  }

  return "Dashboard";
}
