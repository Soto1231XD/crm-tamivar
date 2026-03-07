import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { MODULE_LABELS, ROLE_LABELS, getAvailableModules, getPrimaryRole, getUserDisplayName } from '../../shared/constants/roles';
import { useAuth } from '../../shared/context/AuthContext';
import type { ModuleKey } from '../../shared/types/rbac';
import dashboardIcon from '../../assets/images/Dashboard.png';
import propiedadesIcon from '../../assets/images/Propiedades.png';
import registrosIcon from '../../assets/images/Registro.png';
import contenidoIcon from '../../assets/images/Contenido.png';
import usuariosIcon from '../../assets/images/Usuarios.png';
import rolIcon from '../../assets/images/Rol.png';
import logsIcon from '../../assets/images/Logs.png';

const MODULE_ICONS: Record<ModuleKey, string> = {
  dashboard: dashboardIcon,
  properties: propiedadesIcon,
  leads: registrosIcon,
  content: contenidoIcon,
  users: usuariosIcon,
  system_roles: rolIcon,
  system_logs: logsIcon,
};

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const roles = user?.roles ?? [];
  const availableModules = getAvailableModules(roles);
  const navItems: Array<{ to: string; label: string; icon: string }> = availableModules.map((module: ModuleKey) => ({
    to: module === 'dashboard' ? '/dashboard' : `/modulos/${module}`,
    label: MODULE_LABELS[module],
    icon: MODULE_ICONS[module],
  }));
  const primaryRole = getPrimaryRole(roles);
  const pageTitle = getPageTitle(location.pathname);
  const displayName = getUserDisplayName(user);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div
        className={[
          'grid min-h-screen w-full transition-[grid-template-columns] duration-300',
          isSidebarCollapsed ? 'grid-cols-[88px_1fr]' : 'grid-cols-[250px_1fr]',
        ].join(' ')}
      >
        <aside
          className={[
            'border-r border-slate-800 bg-sidebar-900 p-4 text-slate-100 transition-all duration-300',
            isSidebarCollapsed ? 'md:px-3' : 'md:p-6',
          ].join(' ')}
        >
          <div className={isSidebarCollapsed ? 'flex justify-center' : undefined}>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              aria-label={isSidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
              title={isSidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {isSidebarCollapsed ? '>>' : '<<'}
            </button>
          </div>

          {!isSidebarCollapsed ? (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-300">CRM TAMIVAR</p>
              <h2 className="mt-2 text-lg font-bold text-white">Panel</h2>
            </>
          ) : null}

          <nav className="mt-8 flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={({ isActive }) =>
                  [
                    'rounded-lg text-sm transition',
                    isSidebarCollapsed ? 'flex justify-center px-2 py-3' : 'px-3 py-2',
                    isActive ? 'bg-slate-700 text-white' : 'text-slate-200 hover:bg-slate-800',
                  ].join(' ')
                }
              >
                <span className={['flex items-center', isSidebarCollapsed ? 'justify-center' : 'gap-2'].join(' ')}>
                  <img src={item.icon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
                  {!isSidebarCollapsed ? <span>{item.label}</span> : null}
                </span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-col">
          <header className="border-b border-slate-200 bg-white px-6 py-4 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed((current) => !current)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:hidden"
                  aria-label={isSidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                  title={isSidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                >
                  {isSidebarCollapsed ? '>>' : '<<'}
                </button>
                <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="text-xs text-slate-600">{primaryRole ? ROLE_LABELS[primaryRole] : 'Sin rol asignado'}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden bg-slate-100 p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard';

  if (pathname.startsWith('/modulos/')) {
    const rawModule = pathname.replace('/modulos/', '') as ModuleKey;
    return MODULE_LABELS[rawModule] ?? 'Módulo';
  }

  return 'Dashboard';
}
