import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MODULE_LABELS, getModulePermissions } from '../../../shared/constants/roles';
import { useAuth } from '../../../shared/context/AuthContext';
import type { ModuleKey } from '../../../shared/types/rbac';

const validModules: ModuleKey[] = ['properties', 'leads', 'content', 'users', 'system_roles', 'system_logs'];

export function ModulePage() {
  const { module } = useParams<{ module: string }>();
  const { user } = useAuth();

  const moduleKey = useMemo<ModuleKey | null>(() => {
    if (!module) return null;
    return validModules.includes(module as ModuleKey) ? (module as ModuleKey) : null;
  }, [module]);

  if (!moduleKey || !user) {
    return null;
  }

  const permissions = getModulePermissions(user.roles, moduleKey);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{MODULE_LABELS[moduleKey]}</h1>
      <p className="mt-2 text-sm text-slate-600">Vista reutilizable por módulo.</p>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <PermissionRow label="Ver" value={permissions.view} />
        <PermissionRow label="Crear" value={permissions.create} />
        <PermissionRow label="Editar" value={permissions.edit} />
        <PermissionRow label="Eliminar" value={permissions.delete} />
      </div>
    </section>
  );
}

function PermissionRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span
        className={[
          'rounded-full px-2 py-0.5 text-xs font-semibold',
          value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600',
        ].join(' ')}
      >
        {value ? 'Permitido' : 'Denegado'}
      </span>
    </div>
  );
}
