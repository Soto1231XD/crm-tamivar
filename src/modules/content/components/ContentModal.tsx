import { useEffect, useState, type ChangeEvent } from 'react';
import cerrarIcon from '../../../assets/images/Cerrar.png';
import { ImageGridUploader } from '../../properties/components/ImageGridUploader';
import type {
  BlogImageRecord,
  BlogRecord,
  CreateBlogPayload,
  UpdateBlogPayload,
} from '../services/content.api';

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
  onSubmit: (
    payload: CreateBlogPayload | UpdateBlogPayload,
    files: File[],
  ) => Promise<string | null>;
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

  if (!isOpen) return null;

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError('');

    const validationError = validateForm(form);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    const payload = {
      titulo: form.titulo.trim(),
      subtitulo: form.subtitulo.trim(),
      resumen: form.resumen.trim() || undefined,
      contenido: form.contenido.trim(),
      etiquetas: parseTags(form.etiquetas),
      publicado: form.publicado,
      fechaPublico: form.fechaPublico || undefined,
      ...(mode === 'edit' ? { imagenes: form.imagenes } : {}),
    };

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 sm:p-4">
      <div className="mx-auto flex min-h-full w-full max-w-4xl items-start justify-center py-3 sm:py-6">
        <div className="flex max-h-[88vh] w-full flex-col rounded-xl bg-white p-4 shadow-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              {mode === 'create' ? 'Crear articulo' : 'Editar articulo'}
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
                label="Titulo"
                required
                value={form.titulo}
                onChange={(value) => updateField('titulo', value)}
              />
              <Field
                label="Subtitulo"
                required
                value={form.subtitulo}
                onChange={(value) => updateField('subtitulo', value)}
              />
              <Field
                label="Resumen"
                value={form.resumen}
                onChange={(value) => updateField('resumen', value)}
              />
              <Field
                label="Etiquetas"
                placeholder="Ej. mercado, lujo, inversion"
                value={form.etiquetas}
                onChange={(value) => updateField('etiquetas', value)}
              />
              <Field
                label="Fecha de publicacion"
                type="datetime-local"
                value={form.fechaPublico}
                onChange={(value) => updateField('fechaPublico', value)}
              />
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.publicado}
                  onChange={(event) => updateField('publicado', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-700"
                />
                <span>Publicado</span>
              </label>
            </div>

            <TextArea
              label="Contenido"
              required
              rows={8}
              value={form.contenido}
              onChange={(value) => updateField('contenido', value)}
            />

            <ImageGridUploader
              label="Imágenes del artículo"
              images={selectedFiles}
              existingImages={form.imagenes}
              onAddImages={handleAddImages}
              onRemoveImage={handleRemoveImage}
              onRemoveExistingImage={removeExistingImage}
            />

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
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      <span>
        {label}
        {required ? <span className="ml-0.5 font-semibold text-red-600">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700">
      <span>
        {label}
        {required ? <span className="ml-0.5 font-semibold text-red-600">*</span> : null}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
      />
    </label>
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
