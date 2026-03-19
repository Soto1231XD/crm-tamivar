import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
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

  // Leemos los permisos
  const permissions = user?.permisos ?? [];
  const availableModules = getAvailableModules(permissions);

  const navItems: Array<{ to: string; label: string; icon: string }> =
    availableModules.map((module: ModuleKey) => ({
      to: module === "dashboard" ? "/dashboard" : `/modulos/${module}`,
      label: MODULE_LABELS[module] || module,
      icon: MODULE_ICONS[module],
    }));

  // Tomamos el primer rol del arreglo que manda el servidor (ej. "Super Administrador")
  const primaryRoleDisplay = user?.roles?.[0] || "Sin rol asignado";
  const pageTitle = getPageTitle(location.pathname);
  const displayName = user
    ? `${user.nombres || ""} ${user.apellido_paterno || ""}`.trim() ||
      user.correo_electronico
    : "Usuario";

  return (
    <div className="h-screen overflow-hidden bg-slate-100 text-slate-900">
      <div className="flex h-full w-full">
        {/* Sidebar Overlay para móviles */}
        {!isSidebarCollapsed && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-sidebar-900 p-4 text-slate-100 transition-all duration-300 md:relative",
            isSidebarCollapsed
              ? "-translate-x-full md:translate-x-0 md:w-[88px] md:px-3"
              : "w-[280px] translate-x-0 md:w-[250px] md:p-6",
          ].join(" ")}
        >
          {/* Header del Sidebar con botón de cerrar */}
          <div
            className={
              isSidebarCollapsed ? "flex justify-center" : "flex justify-end"
            }
          >
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              <img src={MenuIcon} alt="Menu" className="h-5 w-5 shrink-0" />
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className="mt-4 flex items-center gap-3">
              <img
                src={logoBlanco}
                alt="Logo Tamivar"
                className="h-12 w-auto shrink-0"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                  CRM TAMIVAR
                </p>
                <h2 className="text-lg font-bold text-white">Panel</h2>
              </div>
            </div>
          )}

          <nav className="mt-8 flex flex-1 flex-col gap-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() =>
                  window.innerWidth < 768 && setIsSidebarCollapsed(true)
                }
                className={({ isActive }) =>
                  [
                    "rounded-lg text-sm transition flex items-center gap-3",
                    isSidebarCollapsed
                      ? "justify-center px-2 py-3"
                      : "px-3 py-2",
                    isActive
                      ? "bg-slate-700 text-white"
                      : "text-slate-200 hover:bg-slate-800",
                  ].join(" ")
                }
              >
                <img src={item.icon} alt="" className="h-6 w-6 shrink-0" />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={logout}
              className={[
                "inline-flex w-full items-center justify-center rounded-lg border border-red-700 bg-red-600 font-semibold text-white transition hover:bg-red-700",
                isSidebarCollapsed
                  ? "h-10 px-2 py-3"
                  : "px-3 py-3 gap-2 text-sm",
              ].join(" ")}
            >
              <img src={LogoutIcon} alt="Logout" className="h-5 w-5 shrink-0" />
              {!isSidebarCollapsed && <span>Cerrar sesión</span>}
            </button>
          </div>
        </aside>

        {/* Contenido Principal */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <header className="border-b border-slate-200 bg-white px-6 py-4 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Botón de hamburguesa siempre visible en móvil para abrir */}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 md:hidden"
                >
                  <img
                    src={MenuIcon}
                    alt="Abrir menú"
                    className="h-5 w-5 brightness-0"
                  />
                </button>
                <h1 className="text-xl font-bold text-slate-900 truncate">
                  {pageTitle}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {/* Contenedor de la Foto o Iniciales */}
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 bg-sidebar-900 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {user?.foto_url ? (
                    <img
                      src={user.foto_url}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    // Si no hay foto, mostramos iniciales
                    <span>
                      {`${user?.nombres?.[0] || ""}${user?.apellido_paterno?.[0] || ""}`.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-slate-900">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-600">{primaryRoleDisplay}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";

  if (pathname.startsWith("/modulos/")) {
    // Tomamos solo la primera parte después de "modulos/" por si hay subrutas
    const rawModule = pathname
      .replace("/modulos/", "")
      .split("/")[0] as ModuleKey;
    return MODULE_LABELS[rawModule] ?? "Módulo";
  }

  return "Dashboard";
}
