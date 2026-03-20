import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LeadRecord, UpdateLeadPayload } from '@/interfaces/lead.interface';
import { AppModal } from '@/components/ui/AppModal';

const LEAD_STATUS_OPTIONS = ['En seguimiento', 'Cancelado', 'Cita agendada', 'En proceso', 'Cerrado'] as const;
const LEAD_PRIORITY_OPTIONS = ['Urgente', 'Normal', 'Bajo Interés'] as const;
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;
const LADA_REGEX = /^\+?[0-9]+$/;

const fieldClassName =
  'w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#312C85] focus:bg-white focus:ring-2 focus:ring-[#312C85]/10';

type PropertyOption = {
  id: number;
  label: string;
};

type EditLeadModalProps = {
  isOpen: boolean;
  lead: LeadRecord | null;
  onClose: () => void;
  onEdit: (leadId: number, payload: UpdateLeadPayload) => Promise<string | null>;
  propertyOptions: PropertyOption[];
};

const editLeadSchema = z.object({
  nombres: z.string().trim().min(1, 'Nombres es obligatorio.').regex(NAME_REGEX, 'Nombres solo permite letras y espacios.'),
  apellidos: z.string().trim().min(1, 'Apellidos es obligatorio.').regex(NAME_REGEX, 'Apellidos solo permite letras y espacios.'),
  telefono: z.string().trim().regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos numéricos.'),
  propiedad_id: z.coerce.number().int().positive('Propiedad es obligatoria.'),
  lada: z
    .string()
    .trim()
    .max(6, 'Lada no puede exceder 6 caracteres.')
    .refine((value) => value.length === 0 || LADA_REGEX.test(value), 'Lada no valida.')
    .optional(),
  correo_electronico: z.union([z.literal(''), z.string().email('Correo electrónico no valido.')]).optional(),
  comentarios: z.string().max(500, 'Comentarios no puede exceder 500 caracteres.').optional(),
  estado: z.string().optional(),
  prioridad: z.string().trim().min(1, 'Prioridad es obligatoria.'),
  fecha_cita: z.string().optional(),
});

type EditLeadFormInput = z.input<typeof editLeadSchema>;
type EditLeadFormValues = z.output<typeof editLeadSchema>;

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <span className="text-sm font-medium text-slate-700">
      {children}
      {required ? <span className="ml-1 font-semibold text-red-600">*</span> : null}
    </span>
  );
}

function sanitizeName(value: string): string {
  return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
}

function sanitizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

function sanitizeLada(value: string): string {
  const normalized = value.replace(/[^\d+]/g, '');
  if (normalized.startsWith('+')) {
    return `+${normalized.slice(1).replace(/\+/g, '').slice(0, 5)}`;
  }

  return normalized.replace(/\+/g, '').slice(0, 5);
}

function toDateTimeLocalValue(value?: string | null): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toDefaultValues(lead: LeadRecord | null): EditLeadFormInput {
  return {
    nombres: lead?.nombres ?? '',
    apellidos: lead?.apellidos ?? '',
    telefono: lead?.telefono != null ? String(lead.telefono) : '',
    propiedad_id: lead?.propiedad_id != null ? String(lead.propiedad_id) : '',
    lada: lead?.lada ?? '+52',
    correo_electronico: lead?.correo_electronico ?? '',
    comentarios: lead?.comentarios ?? '',
    estado: lead?.estado ?? 'En seguimiento',
    prioridad: lead?.prioridad ?? 'Normal',
    fecha_cita: toDateTimeLocalValue(lead?.fecha_cita),
  };
}

export function EditLeadModal({ isOpen, lead, onClose, onEdit, propertyOptions }: EditLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<EditLeadFormInput, unknown, EditLeadFormValues>({
    resolver: zodResolver(editLeadSchema),
    defaultValues: toDefaultValues(lead),
  });

  useEffect(() => {
    reset(toDefaultValues(lead));
    setSubmitError('');
    setIsSubmitting(false);
  }, [lead, isOpen, reset]);

  if (!lead) return null;
  const currentLead = lead;

  function closeModal() {
    setSubmitError('');
    setIsSubmitting(false);
    onClose();
  }

  async function onSubmit(values: EditLeadFormValues) {
    setSubmitError('');
    setIsSubmitting(true);

    const payload: UpdateLeadPayload = {
      nombres: values.nombres.trim(),
      apellidos: values.apellidos.trim(),
      telefono: values.telefono,
      propiedad_id: values.propiedad_id,
      lada: values.lada?.trim() || undefined,
      correo_electronico: values.correo_electronico?.trim() || undefined,
      comentarios: values.comentarios?.trim() || undefined,
      estado: values.estado?.trim() || undefined,
      prioridad: values.prioridad.trim(),
      fecha_cita: values.fecha_cita?.trim() || undefined,
    };

    const error = await onEdit(currentLead.id, payload);
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
      title="Editar registro"
      subtitle="Actualiza la información del cliente y ajusta el seguimiento sin salir de la vista."
      maxWidthClassName="max-w-2xl"
      panelClassName="max-h-[88vh]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Detalles del registro</p>
            <p className="mt-1 text-sm text-slate-600">Revisa los datos clave del cliente antes de guardar cambios en la oportunidad.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Nombres</FieldLabel>
              <input
                type="text"
                {...register('nombres', {
                  onChange: (event) => {
                    event.target.value = sanitizeName(event.target.value);
                  },
                })}
                className={fieldClassName}
              />
              {errors.nombres ? <span className="text-xs text-red-600">{errors.nombres.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Apellidos</FieldLabel>
              <input
                type="text"
                {...register('apellidos', {
                  onChange: (event) => {
                    event.target.value = sanitizeName(event.target.value);
                  },
                })}
                className={fieldClassName}
              />
              {errors.apellidos ? <span className="text-xs text-red-600">{errors.apellidos.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel>Lada</FieldLabel>
              <input
                type="text"
                {...register('lada', {
                  onChange: (event) => {
                    event.target.value = sanitizeLada(event.target.value);
                  },
                })}
                className={fieldClassName}
                placeholder="+52"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Teléfono</FieldLabel>
              <input
                type="text"
                inputMode="numeric"
                {...register('telefono', {
                  onChange: (event) => {
                    event.target.value = sanitizePhone(event.target.value);
                  },
                })}
                className={fieldClassName}
                maxLength={10}
                placeholder="9981144249"
              />
              {errors.telefono ? <span className="text-xs text-red-600">{errors.telefono.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <FieldLabel>Correo electrónico</FieldLabel>
              <input type="email" {...register('correo_electronico')} className={fieldClassName} placeholder="usuario@correo.com" />
              {errors.correo_electronico ? <span className="text-xs text-red-600">{errors.correo_electronico.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Propiedad</FieldLabel>
              <select {...register('propiedad_id')} className={fieldClassName}>
                <option value="">Selecciona una propiedad</option>
                {propertyOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.propiedad_id ? <span className="text-xs text-red-600">{errors.propiedad_id.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel>Estado</FieldLabel>
              <select {...register('estado')} className={fieldClassName}>
                {LEAD_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel>Fecha de cita</FieldLabel>
              <input type="datetime-local" {...register('fecha_cita')} className={fieldClassName} />
            </label>

            <label className="flex flex-col gap-1.5">
              <FieldLabel required>Prioridad</FieldLabel>
              <select {...register('prioridad')} className={fieldClassName}>
                {LEAD_PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.prioridad ? <span className="text-xs text-red-600">{errors.prioridad.message}</span> : null}
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <FieldLabel>Comentarios</FieldLabel>
              <textarea
                {...register('comentarios')}
                rows={3}
                className={`${fieldClassName} resize-none`}
                placeholder="Comentarios del registro"
              />
            </label>
          </div>
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
