import { useEffect, useState, type ChangeEvent, type FormEvent, type HTMLAttributes } from 'react';
import { AppModal } from '@/components/ui/AppModal';
import type { CreateUserPayload, RoleOptionRecord, UpdateUserPayload, UserRecord } from '@/interfaces/user.interface';
import { getFullImageUrl } from '@/shared/utils/imageUrl';

type UserModalMode = 'create' | 'edit';

type UserModalProps = {
  isOpen: boolean;
  mode: UserModalMode;
  user?: UserRecord | null;
  roles: RoleOptionRecord[];
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload, photoFile?: File | null) => Promise<string | null>;
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

function Field({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
  inputMode,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      />
    </label>
  );
}

export function UserModal({ isOpen, mode, user, roles, onClose, onSubmit }: UserModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [photoRemoved, setPhotoRemoved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(getInitialForm(user));
    setSubmitError('');
    setIsSubmitting(false);
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl(user?.foto_url?.trim() || '');
    setPhotoRemoved(false);
  }, [isOpen, user]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

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

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Selecciona una imagen valida para la foto de perfil.');
      event.target.value = '';
      return;
    }

    setSubmitError('');
    if (photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setSelectedPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setPhotoRemoved(false);
    event.target.value = '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError('');

    const validationError = validateForm(form, mode);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    const payload =
      mode === 'create'
        ? {
            nombres: form.nombres.trim(),
            apellido_paterno: form.apellido_paterno.trim(),
            apellido_materno: form.apellido_materno.trim(),
            telefono: form.telefono.trim(),
            correo_electronico: form.correo_electronico.trim(),
            foto_url: form.foto_url.trim() || undefined,
            folio_certificacion: form.folio_certificacion.trim() || undefined,
            roles_ids: form.roles_ids,
            contrasena: form.contrasena.trim(),
          }
        : buildUpdatePayload(form, user, photoRemoved);

    if (
      mode === 'edit' &&
      Object.keys(payload).length === 0 &&
      !selectedPhotoFile &&
      !photoRemoved
    ) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    const error = await onSubmit(payload, selectedPhotoFile);
    setIsSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    onClose();
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Crear usuario' : 'Editar usuario'}
      subtitle={
        mode === 'create'
          ? 'Captura la información principal, acceso y roles del usuario dentro del CRM.'
          : 'Actualiza los datos del usuario y sus accesos sin salir de la vista actual.'
      }
      maxWidthClassName="max-w-3xl"
      panelClassName="max-h-[88vh]"
    >
      <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-slate-600">
        <span className="font-semibold text-red-600">*</span> Campo obligatorio
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Información del usuario</p>
            <p className="mt-1 text-sm text-slate-600">
              Completa los datos personales y de acceso del usuario para dejarlo listo dentro del sistema.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
              label="Teléfono"
              required
              value={form.telefono}
              inputMode="numeric"
              maxLength={10}
              placeholder="9981144249"
              onChange={(value) => updateField('telefono', value.replace(/\D/g, '').slice(0, 10))}
            />
            <Field
              label="Correo electrónico"
              required
              type="email"
              value={form.correo_electronico}
              placeholder="usuario@correo.com"
              onChange={(value) => updateField('correo_electronico', value)}
            />
            <Field
              label={mode === 'create' ? 'Contraseña' : 'Contraseña nueva'}
              required={mode === 'create'}
              type="password"
              value={form.contrasena}
              onChange={(value) => updateField('contrasena', value)}
            />
            <Field
              label="Folio certificación"
              value={form.folio_certificacion}
              onChange={(value) => updateField('folio_certificacion', value)}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-lg font-bold text-slate-600">
                {photoPreviewUrl ? (
                  <img
                    src={getFullImageUrl(photoPreviewUrl)}
                    alt="Vista previa de la foto de perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{`${form.nombres?.[0] || ''}${form.apellido_paterno?.[0] || ''}`.toUpperCase() || 'U'}</span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-col gap-1">
                  <FieldLabel>Foto de perfil</FieldLabel>
                  <p className="text-xs leading-5 text-slate-500">
                    Selecciona una imagen para el perfil del usuario. Se optimiza antes de guardarse.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-[#312C85] transition-colors hover:bg-indigo-100">
                    <span>{photoPreviewUrl ? 'Cambiar imagen' : 'Subir imagen'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>

                  {photoPreviewUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (photoPreviewUrl.startsWith('blob:')) {
                          URL.revokeObjectURL(photoPreviewUrl);
                        }
                        setSelectedPhotoFile(null);
                        setPhotoPreviewUrl('');
                        setPhotoRemoved(Boolean(user?.foto_url));
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Quitar imagen
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Roles y acceso</p>
            <p className="mt-1 text-sm text-slate-600">
              Selecciona al menos un rol para definir los permisos y el alcance operativo del usuario.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((role) => {
              const selected = form.roles_ids.includes(role.id);

              return (
                <label
                  key={role.id}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition ${
                    selected
                      ? 'border-[#312C85]/20 bg-indigo-50 text-slate-800'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleRole(role.id)}
                    className="h-4 w-4 rounded border-slate-300 text-[#312C85] focus:ring-[#312C85]"
                  />
                  <span className="font-medium">{role.rol}</span>
                </label>
              );
            })}
          </div>
        </div>

        {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

        <div className="flex items-center justify-center gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
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
    </AppModal>
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

function arraysEqual(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;

  const sortedLeft = [...left].sort((a, b) => a - b);
  const sortedRight = [...right].sort((a, b) => a - b);

  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function buildUpdatePayload(form: FormState, user?: UserRecord | null, photoRemoved = false): UpdateUserPayload {
  const initial = getInitialForm(user);
  const payload: UpdateUserPayload = {};

  if (form.nombres.trim() !== initial.nombres.trim()) {
    payload.nombres = form.nombres.trim();
  }
  if (form.apellido_paterno.trim() !== initial.apellido_paterno.trim()) {
    payload.apellido_paterno = form.apellido_paterno.trim();
  }
  if (form.apellido_materno.trim() !== initial.apellido_materno.trim()) {
    payload.apellido_materno = form.apellido_materno.trim();
  }
  if (form.telefono.trim() !== initial.telefono.trim()) {
    payload.telefono = form.telefono.trim();
  }
  if (form.correo_electronico.trim() !== initial.correo_electronico.trim()) {
    payload.correo_electronico = form.correo_electronico.trim();
  }
  if (photoRemoved && initial.foto_url.trim()) {
    payload.foto_url = '';
  }
  if ((form.folio_certificacion.trim() || '') !== (initial.folio_certificacion.trim() || '')) {
    payload.folio_certificacion = form.folio_certificacion.trim() || undefined;
  }
  if (!arraysEqual(form.roles_ids, initial.roles_ids)) {
    payload.roles_ids = form.roles_ids;
  }
  if (form.contrasena.trim()) {
    payload.contrasena = form.contrasena.trim();
  }

  return payload;
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
