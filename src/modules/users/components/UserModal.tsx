import { useEffect, useState } from 'react';
import cerrarIcon from '../../../assets/images/Cerrar.png';
import type { CreateUserPayload, RoleOptionRecord, UpdateUserPayload, UserRecord } from '../services/users.api';

type UserModalMode = 'create' | 'edit';

type UserModalProps = {
  isOpen: boolean;
  mode: UserModalMode;
  user?: UserRecord | null;
  roles: RoleOptionRecord[];
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => Promise<string | null>;
};

type FormState = {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  telefono: string;
  correo_electronico: string;
  contrasena: string;
  foto_url: string;
  folio_certificacion: string;
  roles_ids: number[];
};

const INITIAL_FORM: FormState = {
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  telefono: '',
  correo_electronico: '',
  contrasena: '',
  foto_url: '',
  folio_certificacion: '',
  roles_ids: [],
};

export function UserModal({ isOpen, mode, user, roles, onClose, onSubmit }: UserModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(getInitialForm(user));
    setSubmitError('');
    setIsSubmitting(false);
  }, [isOpen, user]);

  if (!isOpen) return null;

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleRole(roleId: number) {
    setForm((current) => ({
      ...current,
      roles_ids: current.roles_ids.includes(roleId)
        ? current.roles_ids.filter((currentId) => currentId !== roleId)
        : [...current.roles_ids, roleId],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError('');

    const validationError = validateForm(form, mode);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    const basePayload = {
      nombres: form.nombres.trim(),
      apellido_paterno: form.apellido_paterno.trim(),
      apellido_materno: form.apellido_materno.trim(),
      telefono: form.telefono.trim(),
      correo_electronico: form.correo_electronico.trim(),
      foto_url: form.foto_url.trim() || undefined,
      folio_certificacion: form.folio_certificacion.trim() || undefined,
      roles_ids: form.roles_ids,
    };

    const payload =
      mode === 'create'
        ? {
            ...basePayload,
            contrasena: form.contrasena.trim(),
          }
        : {
            ...basePayload,
            contrasena: form.contrasena.trim() || undefined,
          };

    setIsSubmitting(true);
    const error = await onSubmit(payload);
    setIsSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 sm:p-4">
      <div className="mx-auto flex min-h-full w-full max-w-3xl items-start justify-center py-3 sm:py-6">
        <div className="flex max-h-[88vh] w-full flex-col rounded-xl bg-white p-4 shadow-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              {mode === 'create' ? 'Crear usuario' : 'Editar usuario'}
            </h3>
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

          <p className="mb-4 text-sm text-slate-600">
            <span className="font-semibold text-red-600">*</span> Campo obligatorio
          </p>

          <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="grid gap-3 md:grid-cols-2">
              <Field
                label="Nombres"
                required
                value={form.nombres}
                onChange={(value) => updateField('nombres', sanitizeName(value))}
              />
              <Field
                label="Apellido paterno"
                required
                value={form.apellido_paterno}
                onChange={(value) => updateField('apellido_paterno', sanitizeName(value))}
              />
              <Field
                label="Apellido materno"
                required
                value={form.apellido_materno}
                onChange={(value) => updateField('apellido_materno', sanitizeName(value))}
              />
              <Field
                label="Telefono"
                required
                value={form.telefono}
                inputMode="numeric"
                maxLength={10}
                onChange={(value) => updateField('telefono', value.replace(/\D/g, '').slice(0, 10))}
              />
              <Field
                label="Correo electronico"
                required
                type="email"
                value={form.correo_electronico}
                onChange={(value) => updateField('correo_electronico', value)}
              />
              <Field
                label={mode === 'create' ? 'Contrasena' : 'Contrasena nueva'}
                required={mode === 'create'}
                type="password"
                value={form.contrasena}
                onChange={(value) => updateField('contrasena', value)}
              />
              <Field
                label="Foto URL"
                value={form.foto_url}
                onChange={(value) => updateField('foto_url', value)}
              />
              <Field
                label="Folio certificacion"
                value={form.folio_certificacion}
                onChange={(value) => updateField('folio_certificacion', value)}
              />
            </div>

            <div>
              <p className="text-sm text-slate-700">
                Roles<span className="ml-0.5 font-semibold text-red-600">*</span>
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.roles_ids.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-700"
                    />
                    <span>{role.rol}</span>
                  </label>
                ))}
              </div>
            </div>

            {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

            <div className="sticky bottom-0 flex items-center justify-center gap-2 border-t border-slate-200 bg-white pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      <span>
        {label}
        {required ? <span className="ml-0.5 font-semibold text-red-600">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
      />
    </label>
  );
}

function getInitialForm(user?: UserRecord | null): FormState {
  if (!user) return INITIAL_FORM;

  return {
    nombres: user.nombres?.trim() || '',
    apellido_paterno: user.apellido_paterno?.trim() || '',
    apellido_materno: user.apellido_materno?.trim() || '',
    telefono: user.telefono != null ? String(user.telefono).trim() : '',
    correo_electronico: user.correo_electronico?.trim() || '',
    contrasena: '',
    foto_url: user.foto_url?.trim() || '',
    folio_certificacion: user.folio_certificacion?.trim() || '',
    roles_ids: getRoleIds(user),
  };
}

function getRoleIds(user: UserRecord): number[] {
  if (!Array.isArray(user.roles)) return [];

  return user.roles
    .map((role) => {
      if (typeof role === 'object' && role?.rol && typeof role.rol === 'object' && typeof role.rol.id === 'number') {
        return role.rol.id;
      }
      return null;
    })
    .filter((roleId): roleId is number => roleId !== null);
}

function sanitizeName(value: string): string {
  return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
}

function validateForm(form: FormState, mode: UserModalMode): string | null {
  if (!form.nombres.trim()) return 'Nombres es obligatorio.';
  if (!form.apellido_paterno.trim()) return 'Apellido paterno es obligatorio.';
  if (!form.apellido_materno.trim()) return 'Apellido materno es obligatorio.';
  if (!/^\d{10}$/.test(form.telefono.trim())) return 'El telefono debe tener exactamente 10 digitos.';
  if (!form.correo_electronico.trim()) return 'Correo electronico es obligatorio.';
  if (!/\S+@\S+\.\S+/.test(form.correo_electronico.trim())) return 'Correo electronico no valido.';
  if (mode === 'create' && form.contrasena.trim().length < 8) return 'La contrasena debe tener al menos 8 caracteres.';
  if (mode === 'edit' && form.contrasena.trim() && form.contrasena.trim().length < 8) {
    return 'La contrasena debe tener al menos 8 caracteres.';
  }
  if (form.roles_ids.length === 0) return 'Debes seleccionar al menos un rol.';

  return null;
}
