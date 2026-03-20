import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { PermissionRecord, SystemRoleRecord } from '@/interfaces/system-role.interface';
import { AppModal } from '@/components/ui/AppModal';

type EditRoleModalProps = {
  isOpen: boolean;
  role: SystemRoleRecord | null;
  permissions: PermissionRecord[];
  onClose: () => void;
  onEdit: (payload: { rol: string; permisosIds: number[] }) => Promise<string | null>;
};

const fieldClassName =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10';

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <span className="text-sm font-medium text-slate-700">
      {children}
      {required ? <span className="ml-1 font-semibold text-red-600">*</span> : null}
    </span>
  );
}

export function EditRoleModal({ isOpen, role, permissions, onClose, onEdit }: EditRoleModalProps) {
  const [roleName, setRoleName] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const groupedPermissions = useMemo(() => groupPermissions(permissions), [permissions]);

  useEffect(() => {
    if (!isOpen) return;

    setRoleName(role?.rol ?? '');
    setSelectedPermissionIds(getSelectedPermissionIds(role));
    setIsSubmitting(false);
    setSubmitError('');
  }, [isOpen, role]);

  if (!role) return null;

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    const error = await onEdit({
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
    <AppModal
      isOpen={isOpen}
      onClose={closeModal}
      title="Editar rol"
      subtitle="Ajusta el nombre y los permisos asignados para este rol."
      maxWidthClassName="max-w-3xl"
      panelClassName="max-h-[88vh]"
    >
      <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-slate-600">
        <span className="font-semibold text-red-600">*</span> Campo obligatorio
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Información del rol</p>
            <p className="mt-1 text-sm text-slate-600">Actualiza el nombre del rol y redefine su alcance operativo dentro del CRM.</p>
          </div>

          <label className="flex flex-col gap-1.5">
            <FieldLabel required>Rol</FieldLabel>
            <input
              type="text"
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              className={fieldClassName}
              placeholder="Ej. Coordinador de marketing"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Permisos por modulo</p>
            <p className="mt-1 text-sm text-slate-600">Activa o desactiva las acciones permitidas para este rol.</p>
          </div>

          {groupedPermissions.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              No hay permisos disponibles para seleccionar.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {groupedPermissions.map((group) => (
                <article key={group.module} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">{group.module}</p>
                  <div className="mt-3 space-y-2.5">
                    {group.permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                          selectedPermissionIds.includes(permission.id)
                            ? 'border-[#312C85]/20 bg-indigo-50 text-slate-800'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissionIds.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#312C85] focus:ring-[#312C85]"
                        />
                        <span className="font-medium">{formatActionName(permission.accion)}</span>
                      </label>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

        <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={closeModal} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </AppModal>
  );
}

function getSelectedPermissionIds(role?: SystemRoleRecord | null): number[] {
  if (!role?.permisos) return [];
  return role.permisos
    .map((entry) => entry?.permiso?.id)
    .filter((id): id is number => typeof id === 'number');
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
