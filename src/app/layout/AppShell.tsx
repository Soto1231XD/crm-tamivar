import { NavLink, Outlet } from 'react-router-dom';
import { MODULE_LABELS, canAccessModule } from '../../shared/constants/roles';
import { useAuth } from '../../shared/context/AuthContext';
import type { ModuleKey } from '../../shared/types/rbac';

const navItems: Array<{ to: string; module: ModuleKey }> = [
  { to: '/', module: 'dashboard' },
  { to: '/propiedades', module: 'properties' },
  { to: '/registros', module: 'leads' },
  { to: '/usuarios', module: 'users' },
  { to: '/rh', module: 'hr' },
];

export function AppShell() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[250px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">CRM TAMIVAR</p>
          <h2 className="mt-2 text-lg font-bold">Panel</h2>

          <nav className="mt-8 flex flex-col gap-2">
            {navItems
              .filter((item) => (user ? canAccessModule(user.roles, item.module) : false))
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'rounded-lg px-3 py-2 text-sm transition',
                      isActive ? 'bg-brand-700 text-white' : 'text-slate-700 hover:bg-slate-100',
                    ].join(' ')
                  }
                >
                  {MODULE_LABELS[item.module]}
                </NavLink>
              ))}
          </nav>
        </aside>

        <main className="p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
