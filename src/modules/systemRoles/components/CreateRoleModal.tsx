import { useMemo, useState } from 'react';
import cerrarIcon from '../../../assets/images/Cerrar.png';
import type { PermissionRecord } from '../services/systemRoles.api';

type CreateRoleModalProps = {
  isOpen: boolean;
  permissions: PermissionRecord[];
  onClose: () => void;
  onCreate: (payload: { rol: string; permisosIds: number[] }) => Promise<string | null>;
};

export function CreateRoleModal({ isOpen, permissions, onClose, onCreate }: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const groupedPermissions = useMemo(() => groupPermissions(permissions), [permissions]);

  if (!isOpen) return null;

  function closeModal() {
    setRoleName('');
    setSelectedPermissionIds([]);
    setIsSubmitting(false);
    setSubmitError('');
    onClose();
  }

  function togglePermission(permissionId: number) {
    setSelectedPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((currentId) => currentId !== permissionId)
        : [...current, permissionId],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError('');

    const normalizedRoleName = roleName.trim();
    if (!normalizedRoleName) {
      setSubmitError('El nombre del rol es obligatorio.');
      return;
    }

    if (selectedPermissionIds.length === 0) {
      setSubmitError('Debes seleccionar al menos un permiso.');
      return;
    }

    setIsSubmitting(true);
    const error = await onCreate({
      rol: normalizedRoleName,
      permisosIds: selectedPermissionIds,
    });
    setIsSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    closeModal();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 sm:p-4">
      <div className="mx-auto flex min-h-full w-full max-w-3xl items-start justify-center py-3 sm:py-6">
        <div className="flex max-h-[88vh] w-full flex-col rounded-xl bg-white p-4 shadow-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Crear rol</h3>
              <p className="mt-1 text-sm text-slate-600">Define el nombre del rol y sus permisos.</p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Cerrar modal"
              title="Cerrar"
              className="rounded-md p-1 hover:bg-slate-100"
            >
              <img src={cerrarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <p className="mb-4 text-sm text-slate-600">
            <span className="font-semibold text-red-600">*</span> Campo obligatorio
          </p>

          <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-1">
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span>
                Rol<span className="ml-0.5 font-semibold text-red-600">*</span>
              </span>
              <input
                type="text"
                value={roleName}
                onChange={(event) => setRoleName(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                placeholder="Ej. Coordinador de marketing"
              />
            </label>

            <div>
              <p className="text-sm text-slate-700">
                Permisos<span className="ml-0.5 font-semibold text-red-600">*</span>
              </p>

              {groupedPermissions.length === 0 ? (
                <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No hay permisos disponibles para seleccionar.
                </p>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {groupedPermissions.map((group) => (
                    <article key={group.module} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{group.module}</p>
                      <div className="mt-3 space-y-2">
                        {group.permissions.map((permission) => (
                          <label key={permission.id} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={selectedPermissionIds.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-700"
                            />
                            <span>{formatActionName(permission.accion)}</span>
                          </label>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

            <div className="sticky bottom-0 flex items-center justify-center gap-2 border-t border-slate-200 bg-white pt-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Guardando...' : 'Crear rol'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function groupPermissions(permissions: PermissionRecord[]) {
  const modulesMap = new Map<string, PermissionRecord[]>();

  permissions.forEach((permission) => {
    const moduleName = formatModuleName(permission.modulo);
    if (!modulesMap.has(moduleName)) {
      modulesMap.set(moduleName, []);
    }
    modulesMap.get(moduleName)?.push(permission);
  });

  return Array.from(modulesMap.entries()).map(([module, groupedPermissions]) => ({
    module,
    permissions: groupedPermissions.sort((left, right) => left.accion.localeCompare(right.accion)),
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
