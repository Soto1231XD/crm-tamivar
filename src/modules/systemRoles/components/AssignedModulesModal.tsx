import cerrarIcon from '../../../assets/images/Cerrar.png';
import type { SystemRoleRecord } from '../services/systemRoles.api';

type AssignedModulesModalProps = {
  isOpen: boolean;
  role: SystemRoleRecord | null;
  onClose: () => void;
};

export function AssignedModulesModal({ isOpen, role, onClose }: AssignedModulesModalProps) {
  if (!isOpen || !role) return null;

  const modules = getRoleModules(role);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 sm:p-4">
      <div className="mx-auto flex min-h-full w-full max-w-2xl items-start justify-center py-3 sm:py-6">
        <div className="w-full rounded-xl bg-white p-4 shadow-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Modulos asignados</h3>
              <p className="mt-1 text-sm text-slate-600">{role.rol}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              title="Cerrar"
              className="rounded-md p-1 hover:bg-slate-100"
            >
              <img src={cerrarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {modules.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Este rol no tiene modulos asignados.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {modules.map((module) => (
                <article key={module.name} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{module.name}</p>
                  <p className="mt-2 text-xs text-slate-500">Permisos</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {module.actions.map((action) => (
                      <span
                        key={`${module.name}-${action}`}
                        className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getRoleModules(role: SystemRoleRecord): Array<{ name: string; actions: string[] }> {
  const modulesMap = new Map<string, Set<string>>();

  (role.permisos ?? []).forEach((permissionEntry) => {
    const modulo = permissionEntry?.permiso?.modulo?.trim();
    const accion = permissionEntry?.permiso?.accion?.trim();
    if (!modulo || !accion) return;

    if (!modulesMap.has(modulo)) {
      modulesMap.set(modulo, new Set<string>());
    }

    modulesMap.get(modulo)?.add(accion);
  });

  return Array.from(modulesMap.entries()).map(([name, actions]) => ({
    name: formatModuleName(name),
    actions: Array.from(actions).map(formatActionName),
  }));
}

function formatModuleName(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ');
}

function formatActionName(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
