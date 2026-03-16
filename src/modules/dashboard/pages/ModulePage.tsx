import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MODULE_LABELS } from '@/shared/auth/navigation.util';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { useHasPermission } from '@/shared/auth/permissions/useHasPermission';
import type { ModuleKey } from '@/shared/auth/interfaces/rbac.interface';

const validModules: ModuleKey[] = [
  'propiedades', 
  'registros', 
  'blogs', 
  'usuarios', 
  'roles', 
  'movimientos'
];

export function ModulePage() {
  const { module } = useParams<{ module: string }>();
  
  // Extraemos el usuario directo del Store y la función 'can' del Hook
  const user = useAuthStore((state) => state.user);
  const { can } = useHasPermission();

  const moduleKey = useMemo<ModuleKey | null>(() => {
    if (!module) return null;
    return validModules.includes(module as ModuleKey) ? (module as ModuleKey) : null;
  }, [module]);

  if (!moduleKey || !user) {
    return null; 
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{MODULE_LABELS[moduleKey]}</h1>
      <p className="mt-2 text-sm text-slate-600">Vista reutilizable por módulo.</p>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {/* Reemplazamos el objeto permissions estático por validaciones dinámicas */}
        <PermissionRow label="Ver" value={can(moduleKey, 'leer')} />
        <PermissionRow label="Crear" value={can(moduleKey, 'crear')} />
        <PermissionRow label="Editar" value={can(moduleKey, 'actualizar')} />
        <PermissionRow label="Eliminar" value={can(moduleKey, 'eliminar')} />
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