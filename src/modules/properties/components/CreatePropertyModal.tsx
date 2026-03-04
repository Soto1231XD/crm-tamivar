import { useState, type ChangeEvent, type FormEvent } from 'react';
import cerrarIcon from '../../../assets/images/Cerrar.png';
import type { CreatePropertyPayload } from '../services/properties.api';

const CREATE_TYPE_OPTIONS = ['Casa', 'Departamento', 'Desarrollo', 'Terreno', 'Local comercial', 'Edificio comercial'] as const;
const CREATE_OPERATION_OPTIONS = ['Venta', 'Renta', 'Preventa'] as const;
const CREATE_STATUS_OPTIONS = ['Disponible', 'Apartado', 'Vendido', 'Preventa', 'Baja'] as const;

type CreatePropertyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: Omit<CreatePropertyPayload, 'creado_por_id'>) => Promise<string | null>;
};

const INITIAL_FORM_STATE = {
  tipo_inmueble: 'Casa',
  tipo_operacion: 'Venta',
  descripcion: '',
  tipos_pago: 'Contado',
  tiene_gravamen: false,
  cuota_mantenimiento: '',
  comentarios: '',
  pisos_tiene: '',
  servicios_instalaciones: '',
  amenidades: '',
  calle: '',
  cp: '',
  municipio: '',
  estado: '',
  fraccionamiento: '',
  num_ext: '',
  referencias: '',
  recamaras: '0',
  banos: '1',
  estacionamiento: '0',
  terreno_m2: '1',
  construccion_m2: '1',
  frente: '1',
  fondo: '1',
  imagen_principal_url: '',
  imagen_principal_titulo: 'Principal',
  precio: '',
  estatus: 'Disponible',
};

export function CreatePropertyModal({ isOpen, onClose, onCreate }: CreatePropertyModalProps) {
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  function resetAndClose() {
    setForm(INITIAL_FORM_STATE);
    setError('');
    setIsSubmitting(false);
    onClose();
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const parsedPrice = Number(form.precio);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Ingresa un precio valido mayor a 0.');
      return;
    }

    const parsedCp = Number(form.cp);
    const parsedNumExt = Number(form.num_ext);
    const parsedRecamaras = Number(form.recamaras);
    const parsedBanos = Number(form.banos);
    const parsedEstacionamiento = Number(form.estacionamiento);
    const parsedTerreno = Number(form.terreno_m2);
    const parsedConstruccion = Number(form.construccion_m2);
    const parsedFrente = Number(form.frente);
    const parsedFondo = Number(form.fondo);

    if (
      Number.isNaN(parsedCp) ||
      Number.isNaN(parsedNumExt) ||
      Number.isNaN(parsedRecamaras) ||
      Number.isNaN(parsedBanos) ||
      Number.isNaN(parsedEstacionamiento) ||
      Number.isNaN(parsedTerreno) ||
      Number.isNaN(parsedConstruccion) ||
      Number.isNaN(parsedFrente) ||
      Number.isNaN(parsedFondo)
    ) {
      setError('Revisa los campos numericos, hay valores invalidos.');
      return;
    }

    if (String(parsedCp).length !== 5) {
      setError('El codigo postal debe tener 5 digitos.');
      return;
    }

    const tiposPago = form.tipos_pago
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (tiposPago.length === 0) {
      setError('Ingresa al menos un tipo de pago.');
      return;
    }

    const payload: Omit<CreatePropertyPayload, 'creado_por_id'> = {
      tipo_inmueble: form.tipo_inmueble.trim(),
      tipo_operacion: form.tipo_operacion.trim(),
      descripcion: form.descripcion.trim() || undefined,
      direccion: {
        cp: parsedCp,
        fraccionamiento: form.fraccionamiento.trim(),
        calle: form.calle.trim(),
        num_ext: parsedNumExt,
        municipio: form.municipio.trim(),
        estado: form.estado.trim(),
        referencias: form.referencias.trim() || undefined,
      },
      precio: parsedPrice,
      estatus: form.estatus.trim(),
      tipos_pago: tiposPago,
      tiene_gravamen: form.tiene_gravamen,
      cuota_mantenimiento: form.cuota_mantenimiento ? Number(form.cuota_mantenimiento) : undefined,
      comentarios: form.comentarios.trim() || undefined,
      pisos_tiene: form.pisos_tiene ? Number(form.pisos_tiene) : undefined,
      servicios_instalaciones: form.servicios_instalaciones.trim() || undefined,
      amenidades: form.amenidades.trim() || undefined,
      medidas: {
        terreno_m2: parsedTerreno,
        construccion_m2: parsedConstruccion,
        frente: parsedFrente,
        fondo: parsedFondo,
      },
      caracteristicas: {
        banos: parsedBanos,
        recamaras: parsedRecamaras,
        estacionamiento: parsedEstacionamiento,
        sala: true,
        comedor: true,
        cocina: true,
        area_servicio: false,
        patio: false,
        jardin: false,
        alberca: false,
        terraza: false,
        amueblado: false,
        bodega: false,
      },
      imagenes: form.imagen_principal_url.trim()
        ? [
            {
              url: form.imagen_principal_url.trim(),
              titulo: form.imagen_principal_titulo.trim() || 'Principal',
              principal: true,
            },
          ]
        : [],
    };

    if (
      !payload.tipo_inmueble ||
      !payload.tipo_operacion ||
      !payload.estatus ||
      !payload.direccion.calle ||
      !payload.direccion.municipio ||
      !payload.direccion.estado ||
      !payload.direccion.fraccionamiento
    ) {
      setError('Completa los campos requeridos.');
      return;
    }

    setIsSubmitting(true);
    const submitError = await onCreate(payload);
    setIsSubmitting(false);

    if (submitError) {
      setError(submitError);
      return;
    }

    resetAndClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 sm:p-4">
      <div className="mx-auto flex min-h-full w-full max-w-3xl items-start justify-center py-3 sm:py-6">
        <div className="flex max-h-[88vh] w-full flex-col rounded-xl bg-white p-4 shadow-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Registrar nueva propiedad</h3>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Cerrar modal"
            title="Cerrar"
            className="rounded-md p-1 hover:bg-slate-100"
          >
            <img src={cerrarIcon} alt="" className="h-6 w-6" aria-hidden="true" />
          </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Tipo de inmueble
              <select
                name="tipo_inmueble"
                value={form.tipo_inmueble}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                required
              >
                {CREATE_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Tipo de operacion
              <select
                name="tipo_operacion"
                value={form.tipo_operacion}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                required
              >
                {CREATE_OPERATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Precio
              <input
                name="precio"
                type="number"
                min="1"
                step="0.01"
                value={form.precio}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                placeholder="Ej. 1250000"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
              Descripcion
              <input
                name="descripcion"
                type="text"
                value={form.descripcion}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                placeholder="Descripcion corta de la propiedad"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Codigo postal
              <input
                name="cp"
                type="number"
                value={form.cp}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                placeholder="Ej. 77500"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Numero exterior
              <input
                name="num_ext"
                type="number"
                value={form.num_ext}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                placeholder="Ej. 120"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Calle
              <input
                name="calle"
                type="text"
                value={form.calle}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                placeholder="Ej. Av. Central 123"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Municipio
              <input
                name="municipio"
                type="text"
                value={form.municipio}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                placeholder="Ej. Benito Juarez"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Estado
              <input
                name="estado"
                type="text"
                value={form.estado}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                placeholder="Ej. Quintana Roo"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
              Fraccionamiento
              <input
                name="fraccionamiento"
                type="text"
                value={form.fraccionamiento}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                placeholder="Ej. Residencial Norte"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
              Tipos de pago (separados por coma)
              <input
                name="tipos_pago"
                type="text"
                value={form.tipos_pago}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                placeholder="Ej. Contado, Credito bancario"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Recamaras
              <input
                name="recamaras"
                type="number"
                min="0"
                value={form.recamaras}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Banos
              <input
                name="banos"
                type="number"
                min="0"
                step="0.5"
                value={form.banos}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Estacionamiento
              <input
                name="estacionamiento"
                type="number"
                min="0"
                value={form.estacionamiento}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Terreno (m2)
              <input
                name="terreno_m2"
                type="number"
                min="1"
                step="0.01"
                value={form.terreno_m2}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Construccion (m2)
              <input
                name="construccion_m2"
                type="number"
                min="1"
                step="0.01"
                value={form.construccion_m2}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Frente
              <input
                name="frente"
                type="number"
                min="1"
                step="0.01"
                value={form.frente}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Fondo
              <input
                name="fondo"
                type="number"
                min="1"
                step="0.01"
                value={form.fondo}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
              URL imagen principal (opcional)
              <input
                name="imagen_principal_url"
                type="url"
                value={form.imagen_principal_url}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                placeholder="https://..."
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
              Estatus
              <select
                name="estatus"
                value={form.estatus}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
                required
              >
                {CREATE_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <div className="sticky bottom-0 flex items-center justify-center gap-2 border-t border-slate-200 bg-white pt-3">
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Guardando...' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
