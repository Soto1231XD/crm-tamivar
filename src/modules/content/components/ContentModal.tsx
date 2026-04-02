import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import type {
  BlogImageRecord,
  BlogRecord,
  CreateBlogPayload,
  UpdateBlogPayload,
} from '@/interfaces/blog.interface';
import { AppModal } from '@/components/ui/AppModal';
import { ImageGridUploader } from '../../properties/components/ImageGridUploader';

type ContentModalMode = 'create' | 'edit';

type FormState = {
  titulo: string;
  subtitulo: string;
  resumen: string;
  contenido: string;
  etiquetas: string;
  publicado: boolean;
  fechaPublico: string;
  imagenes: BlogImageRecord[];
};

type ContentModalProps = {
  isOpen: boolean;
  mode: ContentModalMode;
  blog?: BlogRecord | null;
  onClose: () => void;
  onSubmit: (payload: CreateBlogPayload | UpdateBlogPayload, files: File[]) => Promise<string | null>;
};

const INITIAL_FORM: FormState = {
  titulo: '',
  subtitulo: '',
  resumen: '',
  contenido: '',
  etiquetas: '',
  publicado: false,
  fechaPublico: '',
  imagenes: [],
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClassName} resize-none`}
      />
    </label>
  );
}

export function ContentModal({ isOpen, mode, blog, onClose, onSubmit }: ContentModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setForm(getInitialForm(blog));
    setSelectedFiles([]);
    setSubmitError('');
    setIsSubmitting(false);
  }, [isOpen, blog]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleAddImages(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setSelectedFiles((current) => [...current, ...newFiles]);
    }

    event.target.value = '';
  }

  function handleRemoveImage(indexToRemove: number) {
    setSelectedFiles((current) => current.filter((_, index) => index !== indexToRemove));
  }

  function removeExistingImage(indexToRemove: number) {
    setForm((current) => ({
      ...current,
      imagenes: current.imagenes.filter((_, index) => index !== indexToRemove),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError('');

    const validationError = validateForm(form);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    const payload =
      mode === 'create'
        ? {
            titulo: form.titulo.trim(),
            subtitulo: form.subtitulo.trim(),
            resumen: form.resumen.trim() || undefined,
            contenido: form.contenido.trim(),
            etiquetas: parseTags(form.etiquetas),
            publicado: form.publicado,
            fechaPublico: form.fechaPublico || undefined,
          }
        : buildUpdatePayload(form, blog);

    if (mode === 'edit' && Object.keys(payload).length === 0 && selectedFiles.length === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    const error = await onSubmit(payload, selectedFiles);
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
      title={mode === 'create' ? 'Crear articulo' : 'Editar articulo'}
      subtitle={
        mode === 'create'
          ? 'Captura el contenido principal, su contexto editorial y las imágenes del articulo.'
          : 'Actualiza el contenido publicado sin salir del flujo editorial.'
      }
      maxWidthClassName="max-w-4xl"
      panelClassName="max-h-[88vh]"
    >
      <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-slate-600">
        <span className="font-semibold text-red-600">*</span> Campo obligatorio
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Información editorial</p>
            <p className="mt-1 text-sm text-slate-600">Define el enfoque del articulo y como se mostrara en la experiencia de lectura.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Titulo" required value={form.titulo} onChange={(value) => updateField('titulo', value)} />
            <Field label="Subtitulo" required value={form.subtitulo} onChange={(value) => updateField('subtitulo', value)} />
            <Field label="Resumen" value={form.resumen} onChange={(value) => updateField('resumen', value)} />
            <Field
              label="Etiquetas"
              placeholder="Ej. mercado, lujo, inversion"
              value={form.etiquetas}
              onChange={(value) => updateField('etiquetas', value)}
            />
            <Field
              label="Fecha de publicación"
              type="datetime-local"
              value={form.fechaPublico}
              onChange={(value) => updateField('fechaPublico', value)}
            />

            <label className="flex flex-col gap-1.5">
              <FieldLabel>Estado de publicación</FieldLabel>
              <div className="flex min-h-[46px] items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5">
                <input
                  type="checkbox"
                  checked={form.publicado}
                  onChange={(event) => updateField('publicado', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#312C85] focus:ring-[#312C85]"
                />
                <span className="text-sm text-slate-700">{form.publicado ? 'Publicado' : 'Borrador'}</span>
              </div>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Contenido</p>
            <p className="mt-1 text-sm text-slate-600">Escribe el cuerpo principal del articulo y organiza el soporte visual del contenido.</p>
          </div>

          <div className="space-y-4">
            <TextArea
              label="Contenido"
              required
              rows={8}
              value={form.contenido}
              onChange={(value) => updateField('contenido', value)}
              placeholder="Desarrolla aquí el contenido del articulo."
            />

            <ImageGridUploader
              label="Imágenes del articulo"
              images={selectedFiles}
              existingImages={form.imagenes}
              onAddImages={handleAddImages}
              onRemoveImage={handleRemoveImage}
              onRemoveExistingImage={removeExistingImage}
            />
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

function getInitialForm(blog?: BlogRecord | null): FormState {
  if (!blog) return INITIAL_FORM;

  return {
    titulo: blog.titulo?.trim() || '',
    subtitulo: blog.subtitulo?.trim() || '',
    resumen: blog.resumen?.trim() || '',
    contenido: blog.contenido?.trim() || '',
    etiquetas: Array.isArray(blog.etiquetas) ? blog.etiquetas.join(', ') : '',
    publicado: blog.publicado === true,
    fechaPublico: toDateTimeLocalValue(blog.fechaPublico),
    imagenes: Array.isArray(blog.imagenes) ? blog.imagenes : [],
  };
}

function arraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function imagesEqual(left: BlogImageRecord[], right: BlogImageRecord[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function buildUpdatePayload(
  form: FormState,
  blog?: BlogRecord | null,
): UpdateBlogPayload {
  const initial = getInitialForm(blog);
  const payload: UpdateBlogPayload = {};
  const currentTags = parseTags(form.etiquetas);
  const initialTags = parseTags(initial.etiquetas);

  if (form.titulo.trim() !== initial.titulo.trim()) {
    payload.titulo = form.titulo.trim();
  }
  if (form.subtitulo.trim() !== initial.subtitulo.trim()) {
    payload.subtitulo = form.subtitulo.trim();
  }
  if ((form.resumen.trim() || '') !== (initial.resumen.trim() || '')) {
    payload.resumen = form.resumen.trim() || undefined;
  }
  if (form.contenido.trim() !== initial.contenido.trim()) {
    payload.contenido = form.contenido.trim();
  }
  if (!arraysEqual(currentTags, initialTags)) {
    payload.etiquetas = currentTags;
  }
  if (form.publicado !== initial.publicado) {
    payload.publicado = form.publicado;
  }
  if ((form.fechaPublico || '') !== (initial.fechaPublico || '')) {
    payload.fechaPublico = form.fechaPublico || undefined;
  }
  if (!imagesEqual(form.imagenes, initial.imagenes)) {
    payload.imagenes = form.imagenes;
  }

  return payload;
}

function validateForm(form: FormState): string | null {
  if (!form.titulo.trim()) return 'Titulo es obligatorio.';
  if (!form.subtitulo.trim()) return 'Subtitulo es obligatorio.';
  if (!form.contenido.trim()) return 'Contenido es obligatorio.';
  if (form.resumen.trim().length > 300) return 'Resumen no puede exceder 300 caracteres.';

  return null;
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toDateTimeLocalValue(value?: string | null): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}
