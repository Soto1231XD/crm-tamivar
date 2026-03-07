import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import type { CreatePropertyPayload, PropertyRecord } from '../services/properties.api';

const TYPE_OPTIONS = ['Casa', 'Departamento', 'Desarrollo', 'Terreno', 'Local comercial', 'Edificio comercial'] as const;
const OPERATION_OPTIONS = ['Venta', 'Renta', 'Preventa'] as const;
const STATUS_OPTIONS = ['Disponible', 'Apartado', 'Vendido', 'Preventa', 'Baja'] as const;
const PAYMENT_OPTIONS = ['Efectivo', 'Infonavit', 'Cofinavit', 'Crédito bancario', 'Fovissste', 'Issfam', 'Otro'] as const;
const NON_NEGATIVE_INTEGER_FIELD_NAMES = new Set(['cp', 'mza', 'lote', 'num_ext', 'num_int']);
const CURRENCY_FIELD_NAMES = new Set(['precio', 'precio_condicionado_monto', 'cuota_mantenimiento']);

type PropertyFormProps = {
  property?: PropertyRecord | null;
  title: string;
  submitLabel: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (payload: Omit<CreatePropertyPayload, 'creado_por_id'>) => Promise<string | null>;
};

type FormState = {
  titulo: string;
  tipo_inmueble: string;
  tipo_operacion: string;
  descripcion: string;
  precio: string;
  precio_condicionado_descripcion: string;
  precio_condicionado_monto: string;
  tipos_pago: string[];
  estatus: string;
  cp: string;
  fraccionamiento: string;
  smz: string;
  mza: string;
  lote: string;
  calle: string;
  num_ext: string;
  num_int: string;
  municipio: string;
  estado: string;
  referencias: string;
  terreno_m2: string;
  construccion_m2: string;
  frente: string;
  fondo: string;
  recamaras: string;
  banos: string;
  estacionamiento: string;
  sala: boolean;
  comedor: boolean;
  cocina: boolean;
  area_servicio: boolean;
  patio: boolean;
  jardin: boolean;
  alberca: boolean;
  terraza: boolean;
  amueblado: boolean;
  bodega: boolean;
  aire_acondicionado: boolean;
  boiler: boolean;
  tiene_gravamen: boolean;
  cuota_mantenimiento: string;
  comentarios: string;
  pisos_tiene: string;
  servicios_instalaciones: string;
  amenidades: string;
  imagen_principal_url: string;
};

const INITIAL_FORM_STATE: FormState = {
  titulo: '',
  tipo_inmueble: 'Casa',
  tipo_operacion: 'Venta',
  descripcion: '',
  precio: '',
  precio_condicionado_descripcion: '',
  precio_condicionado_monto: '',
  tipos_pago: [],
  estatus: 'Disponible',
  cp: '',
  fraccionamiento: '',
  smz: '',
  mza: '',
  lote: '',
  calle: '',
  num_ext: '',
  num_int: '',
  municipio: '',
  estado: '',
  referencias: '',
  terreno_m2: '1',
  construccion_m2: '1',
  frente: '1',
  fondo: '1',
  recamaras: '0',
  banos: '1',
  estacionamiento: '0',
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
  aire_acondicionado: false,
  boiler: false,
  tiene_gravamen: false,
  cuota_mantenimiento: '',
  comentarios: '',
  pisos_tiene: '',
  servicios_instalaciones: '',
  amenidades: '',
  imagen_principal_url: '',
};

function toFormState(property?: PropertyRecord | null): FormState {
  if (!property) return INITIAL_FORM_STATE;

  const principalImage = property.imagenes?.find((image) => image.principal) ?? property.imagenes?.[0];
  return {
    titulo: property.titulo ?? '',
    tipo_inmueble: property.tipo_inmueble ?? 'Casa',
    tipo_operacion: property.tipo_operacion ?? 'Venta',
    descripcion: property.descripcion ?? '',
    precio: property.precio != null ? String(property.precio) : '',
    precio_condicionado_descripcion: property.precio_condicionado?.descripcion ?? '',
    precio_condicionado_monto: property.precio_condicionado?.monto != null ? String(property.precio_condicionado.monto) : '',
    tipos_pago: Array.isArray(property.tipos_pago) ? property.tipos_pago : [],
    estatus: property.estatus ?? 'Disponible',
    cp: property.direccion?.cp != null ? String(property.direccion.cp) : '',
    fraccionamiento: property.direccion?.fraccionamiento ?? '',
    smz: property.direccion?.smz != null ? String(property.direccion.smz) : '',
    mza: property.direccion?.mza != null ? String(property.direccion.mza) : '',
    lote: property.direccion?.lote != null ? String(property.direccion.lote) : '',
    calle: property.direccion?.calle ?? '',
    num_ext: property.direccion?.num_ext != null ? String(property.direccion.num_ext) : '',
    num_int: property.direccion?.num_int != null ? String(property.direccion.num_int) : '',
    municipio: property.direccion?.municipio ?? '',
    estado: property.direccion?.estado ?? '',
    referencias: property.direccion?.referencias ?? '',
    terreno_m2: property.medidas?.terreno_m2 != null ? String(property.medidas.terreno_m2) : '1',
    construccion_m2: property.medidas?.construccion_m2 != null ? String(property.medidas.construccion_m2) : '1',
    frente: property.medidas?.frente != null ? String(property.medidas.frente) : '1',
    fondo: property.medidas?.fondo != null ? String(property.medidas.fondo) : '1',
    recamaras: property.caracteristicas?.recamaras != null ? String(property.caracteristicas.recamaras) : '0',
    banos: property.caracteristicas?.banos != null ? String(property.caracteristicas.banos) : '1',
    estacionamiento: property.caracteristicas?.estacionamiento != null ? String(property.caracteristicas.estacionamiento) : '0',
    sala: Boolean(property.caracteristicas?.sala),
    comedor: Boolean(property.caracteristicas?.comedor),
    cocina: Boolean(property.caracteristicas?.cocina),
    area_servicio: Boolean(property.caracteristicas?.area_servicio),
    patio: Boolean(property.caracteristicas?.patio),
    jardin: Boolean(property.caracteristicas?.jardin),
    alberca: Boolean(property.caracteristicas?.alberca),
    terraza: Boolean(property.caracteristicas?.terraza),
    amueblado: Boolean(property.caracteristicas?.amueblado),
    bodega: Boolean(property.caracteristicas?.bodega),
    aire_acondicionado: false,
    boiler: false,
    tiene_gravamen: Boolean(property.tiene_gravamen),
    cuota_mantenimiento: property.cuota_mantenimiento != null ? String(property.cuota_mantenimiento) : '',
    comentarios: property.comentarios ?? '',
    pisos_tiene: property.pisos_tiene != null ? String(property.pisos_tiene) : '',
    servicios_instalaciones: property.servicios_instalaciones ?? '',
    amenidades: property.amenidades ?? '',
    imagen_principal_url: principalImage?.url ?? '',
  };
}

export function PropertyForm({
  property,
  title,
  submitLabel,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: PropertyFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(property));
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setForm(toFormState(property));
    setSubmitError('');
  }, [property]);

  function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name } = event.target;
    if (event.target instanceof HTMLInputElement && CURRENCY_FIELD_NAMES.has(name)) {
      setForm((prev) => ({ ...prev, [name]: formatCurrencyInput(event.target.value) }));
      return;
    }
    if (event.target instanceof HTMLInputElement && NON_NEGATIVE_INTEGER_FIELD_NAMES.has(name)) {
      setForm((prev) => ({ ...prev, [name]: event.target.value.replace(/\D/g, '') }));
      return;
    }
    const value =
      event.target instanceof HTMLInputElement && event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePaymentToggle(option: string) {
    setForm((prev) => ({
      ...prev,
      tipos_pago: prev.tipos_pago.includes(option)
        ? prev.tipos_pago.filter((item) => item !== option)
        : [...prev.tipos_pago, option],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError('');

    const parsedPrice = parseFormattedNumber(form.precio);
    const parsedCp = Number(form.cp);
    const parsedNumExt = Number(form.num_ext);
    const parsedTerreno = Number(form.terreno_m2);
    const parsedConstruccion = Number(form.construccion_m2);
    const parsedFrente = Number(form.frente);
    const parsedFondo = Number(form.fondo);
    const parsedRecamaras = Number(form.recamaras);
    const parsedBanos = Number(form.banos);
    const parsedEstacionamiento = Number(form.estacionamiento);
    const parsedSmz = Number(form.smz);
    const parsedMza = Number(form.mza);
    const parsedLote = Number(form.lote);
    const parsedNumInt = Number(form.num_int);
    const parsedPrecioCondicionadoMonto = parseFormattedNumber(form.precio_condicionado_monto);

    if (!form.titulo.trim()) return setSubmitError('El título es obligatorio.');
    if (!form.tipo_inmueble.trim()) return setSubmitError('El tipo de inmueble es obligatorio.');
    if (!form.tipo_operacion.trim()) return setSubmitError('El tipo de operación es obligatorio.');
    if (!form.estatus.trim()) return setSubmitError('El estatus es obligatorio.');
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return setSubmitError('El precio es obligatorio y debe ser mayor a 0.');
    }

    if (
      Number.isNaN(parsedCp) ||
      Number.isNaN(parsedNumExt) ||
      Number.isNaN(parsedTerreno) ||
      Number.isNaN(parsedConstruccion) ||
      Number.isNaN(parsedFrente) ||
      Number.isNaN(parsedFondo) ||
      Number.isNaN(parsedRecamaras) ||
      Number.isNaN(parsedBanos) ||
      Number.isNaN(parsedEstacionamiento)
    ) {
      return setSubmitError('Completa correctamente los campos obligatorios numéricos.');
    }

    if (String(parsedCp).length !== 5) return setSubmitError('El código postal debe tener 5 dígitos.');
    if (
      (form.smz && Number.isNaN(parsedSmz)) ||
      (form.mza && Number.isNaN(parsedMza)) ||
      (form.lote && Number.isNaN(parsedLote)) ||
      (form.num_int && Number.isNaN(parsedNumInt))
    ) {
      return setSubmitError('Revisa los campos opcionales de dirección.');
    }

    if (form.tipos_pago.length === 0) return setSubmitError('Selecciona al menos un tipo de pago.');
    if (!form.calle.trim() || !form.municipio.trim() || !form.estado.trim() || !form.fraccionamiento.trim()) {
      return setSubmitError('La dirección es obligatoria.');
    }

    const payload: Omit<CreatePropertyPayload, 'creado_por_id'> = {
      titulo: form.titulo.trim(),
      tipo_inmueble: form.tipo_inmueble.trim(),
      tipo_operacion: form.tipo_operacion.trim(),
      descripcion: form.descripcion.trim() || undefined,
      precio: parsedPrice,
      precio_condicionado:
        form.precio_condicionado_monto && !Number.isNaN(parsedPrecioCondicionadoMonto)
          ? {
              descripcion: form.precio_condicionado_descripcion.trim() || undefined,
              monto: parsedPrecioCondicionadoMonto,
            }
          : undefined,
      tipos_pago: form.tipos_pago,
      estatus: form.estatus.trim(),
      tiene_gravamen: form.tiene_gravamen,
      cuota_mantenimiento: form.cuota_mantenimiento ? parseFormattedNumber(form.cuota_mantenimiento) : undefined,
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
      direccion: {
        cp: parsedCp,
        fraccionamiento: form.fraccionamiento.trim(),
        smz: form.smz ? parsedSmz : undefined,
        mza: form.mza ? parsedMza : undefined,
        lote: form.lote ? parsedLote : undefined,
        calle: form.calle.trim(),
        num_ext: parsedNumExt,
        num_int: form.num_int ? parsedNumInt : undefined,
        municipio: form.municipio.trim(),
        estado: form.estado.trim(),
        referencias: form.referencias.trim() || undefined,
      },
      caracteristicas: {
        banos: parsedBanos,
        recamaras: parsedRecamaras,
        estacionamiento: parsedEstacionamiento,
        sala: form.sala,
        comedor: form.comedor,
        cocina: form.cocina,
        area_servicio: form.area_servicio,
        patio: form.patio,
        jardin: form.jardin,
        alberca: form.alberca,
        terraza: form.terraza,
        amueblado: form.amueblado,
        bodega: form.bodega,
      },
      imagenes: form.imagen_principal_url.trim()
        ? [
            {
              url: form.imagen_principal_url.trim(),
              titulo: 'Principal',
              principal: true,
            },
          ]
        : [],
    };

    const error = await onSubmit(payload);
    if (error) {
      setSubmitError(error);
      return;
    }
  }

  return (
    <div className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">Completa la información de la propiedad.</p>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-semibold text-red-600">*</span> Campo obligatorio
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">1. Información general</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <FieldInput label="Título" name="titulo" value={form.titulo} onChange={handleInputChange} required />
              <FieldSelect label="Tipo de inmueble" name="tipo_inmueble" value={form.tipo_inmueble} onChange={handleInputChange} options={TYPE_OPTIONS} required />
              <FieldSelect label="Tipo de operación" name="tipo_operacion" value={form.tipo_operacion} onChange={handleInputChange} options={OPERATION_OPTIONS} required />
              <FieldTextarea label="Descripción" name="descripcion" value={form.descripcion} onChange={handleInputChange} className="md:col-span-2" />
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">2. Precio y estado</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <FieldInput label="Precio (MXN)" name="precio" value={form.precio} onChange={handleInputChange} type="text" inputMode="decimal" required />
              <FieldSelect label="Estatus" name="estatus" value={form.estatus} onChange={handleInputChange} options={STATUS_OPTIONS} required />
              <PaymentMultiSelect
                label="Tipos de pago"
                selectedValues={form.tipos_pago}
                options={PAYMENT_OPTIONS}
                onToggle={handlePaymentToggle}
                className="md:col-span-2"
                required
              />
              <FieldInput label="Precio condicionado (monto) (MXN)" name="precio_condicionado_monto" value={form.precio_condicionado_monto} onChange={handleInputChange} type="text" inputMode="decimal" />
              <FieldTextarea label="Precio condicionado (descripción)" name="precio_condicionado_descripcion" value={form.precio_condicionado_descripcion} onChange={handleInputChange} />
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">3. Dirección</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <FieldInput label="Código postal" name="cp" value={form.cp} onChange={handleInputChange} type="number" required />
              <FieldInput label="Fraccionamiento" name="fraccionamiento" value={form.fraccionamiento} onChange={handleInputChange} required />
              <FieldInput label="Calle" name="calle" value={form.calle} onChange={handleInputChange} required />
              <FieldInput label="Número exterior" name="num_ext" value={form.num_ext} onChange={handleInputChange} type="number" required />
              <FieldInput label="Número interior" name="num_int" value={form.num_int} onChange={handleInputChange} type="number" />
              <FieldInput label="Municipio" name="municipio" value={form.municipio} onChange={handleInputChange} required />
              <FieldInput label="Estado" name="estado" value={form.estado} onChange={handleInputChange} required />
              <FieldInput label="Región" name="smz" value={form.smz} onChange={handleInputChange} type="number" />
              <FieldInput label="Manzana" name="mza" value={form.mza} onChange={handleInputChange} type="number" />
              <FieldInput label="Lote" name="lote" value={form.lote} onChange={handleInputChange} type="number" />
              <FieldTextarea label="Referencias" name="referencias" value={form.referencias} onChange={handleInputChange} className="md:col-span-2" />
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">4. Medidas y características</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <FieldInput label="Terreno (m2)" name="terreno_m2" value={form.terreno_m2} onChange={handleInputChange} type="number" min="1" step="0.01" required />
              <FieldInput label="Construcción (m2)" name="construccion_m2" value={form.construccion_m2} onChange={handleInputChange} type="number" min="1" step="0.01" required />
              <FieldInput label="Frente" name="frente" value={form.frente} onChange={handleInputChange} type="number" min="1" step="0.01" required />
              <FieldInput label="Fondo" name="fondo" value={form.fondo} onChange={handleInputChange} type="number" min="1" step="0.01" required />
              <FieldInput label="Recámaras" name="recamaras" value={form.recamaras} onChange={handleInputChange} type="number" min="0" required />
              <FieldInput label="Baños" name="banos" value={form.banos} onChange={handleInputChange} type="number" min="0" step="0.5" required />
              <FieldInput label="Estacionamiento" name="estacionamiento" value={form.estacionamiento} onChange={handleInputChange} type="number" min="0" required />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <Toggle name="sala" checked={form.sala} onChange={handleInputChange} label="Sala" />
              <Toggle name="comedor" checked={form.comedor} onChange={handleInputChange} label="Comedor" />
              <Toggle name="cocina" checked={form.cocina} onChange={handleInputChange} label="Cocina" />
              <Toggle name="area_servicio" checked={form.area_servicio} onChange={handleInputChange} label="Área de servicio" />
              <Toggle name="patio" checked={form.patio} onChange={handleInputChange} label="Patio" />
              <Toggle name="jardin" checked={form.jardin} onChange={handleInputChange} label="Jardín" />
              <Toggle name="alberca" checked={form.alberca} onChange={handleInputChange} label="Alberca" />
              <Toggle name="terraza" checked={form.terraza} onChange={handleInputChange} label="Terraza" />
              <Toggle name="amueblado" checked={form.amueblado} onChange={handleInputChange} label="Amueblado" />
              <Toggle name="bodega" checked={form.bodega} onChange={handleInputChange} label="Bodega" />
              <Toggle name="aire_acondicionado" checked={form.aire_acondicionado} onChange={handleInputChange} label="Aire acondicionado" />
              <Toggle name="boiler" checked={form.boiler} onChange={handleInputChange} label="Boiler" />
            </div>
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">5. Extras</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Toggle name="tiene_gravamen" checked={form.tiene_gravamen} onChange={handleInputChange} label="Tiene gravamen" className="md:col-span-2" />
              <FieldInput label="Cuota mantenimiento (MXN)" name="cuota_mantenimiento" value={form.cuota_mantenimiento} onChange={handleInputChange} type="text" inputMode="decimal" />
              <FieldInput label="Pisos" name="pisos_tiene" value={form.pisos_tiene} onChange={handleInputChange} type="number" min="0" />
              <FieldTextarea label="Servicios e instalaciones" name="servicios_instalaciones" value={form.servicios_instalaciones} onChange={handleInputChange} className="md:col-span-2" />
              <FieldTextarea label="Amenidades" name="amenidades" value={form.amenidades} onChange={handleInputChange} className="md:col-span-2" />
              <FieldInput label="URL imagen principal" name="imagen_principal_url" value={form.imagen_principal_url} onChange={handleInputChange} type="url" className="md:col-span-2" />
              <FieldTextarea label="Comentarios" name="comentarios" value={form.comentarios} onChange={handleInputChange} className="md:col-span-2" />
            </div>
          </section>

          {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

          <div className="sticky bottom-0 flex items-center justify-center gap-2 border-t border-slate-200 bg-white pt-4">
            <button type="button" onClick={onCancel} className="rounded-lg bg-[#FD3939] px-4 py-2 text-sm font-semibold text-white">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">
              {isSubmitting ? 'Guardando...' : submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

type FieldInputProps = {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  type?: string;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'email' | 'search' | 'tel' | 'url' | 'none';
  required?: boolean;
  min?: string;
  step?: string;
  className?: string;
};

function FieldInput({ label, name, value, onChange, type = 'text', inputMode, required, min, step, className }: FieldInputProps) {
  return (
    <label className={`flex flex-col gap-1 text-sm text-slate-700 ${className ?? ''}`}>
      <LabelText label={label} required={required} />
      <input name={name} type={type} inputMode={inputMode} value={value} onChange={onChange} required={required} min={min} step={step} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring" />
    </label>
  );
}

type FieldSelectProps = {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  options: readonly string[];
  required?: boolean;
  className?: string;
};

function FieldSelect({ label, name, value, onChange, options, required, className }: FieldSelectProps) {
  return (
    <label className={`flex flex-col gap-1 text-sm text-slate-700 ${className ?? ''}`}>
      <LabelText label={label} required={required} />
      <select name={name} value={value} onChange={onChange} required={required} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

type FieldTextareaProps = {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  className?: string;
};

function FieldTextarea({ label, name, value, onChange, className }: FieldTextareaProps) {
  return (
    <label className={`flex flex-col gap-1 text-sm text-slate-700 ${className ?? ''}`}>
      <LabelText label={label} />
      <textarea name={name} value={value} onChange={onChange} className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring" />
    </label>
  );
}

type ToggleProps = {
  name: string;
  label: string;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  className?: string;
};

function Toggle({ name, label, checked, onChange, className }: ToggleProps) {
  return (
    <label className={`flex items-center gap-2 text-sm text-slate-700 ${className ?? ''}`}>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

type PaymentMultiSelectProps = {
  label: string;
  selectedValues: string[];
  options: readonly string[];
  onToggle: (option: string) => void;
  className?: string;
  required?: boolean;
};

function PaymentMultiSelect({ label, selectedValues, options, onToggle, className, required }: PaymentMultiSelectProps) {
  return (
    <div className={`flex flex-col gap-1 text-sm text-slate-700 ${className ?? ''}`}>
      <LabelText label={label} required={required} />
      <details className="group relative">
        <summary className="list-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate">
              {selectedValues.length > 0 ? selectedValues.join(', ') : 'Selecciona uno o más tipos de pago'}
            </span>
            <span className="text-xs text-slate-500 group-open:rotate-180">v</span>
          </div>
        </summary>
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <div className="space-y-2">
            {options.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={selectedValues.includes(option)} onChange={() => onToggle(option)} />
                {option}
              </label>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}

function LabelText({ label, required }: { label: string; required?: boolean }) {
  return (
    <span>
      {label}
      {required ? <span className="ml-0.5 font-semibold text-red-600">*</span> : null}
    </span>
  );
}

function parseFormattedNumber(value: string): number {
  return Number(value.replace(/,/g, ''));
}

function formatCurrencyInput(value: string): string {
  const sanitized = value.replace(/[^\d.]/g, '');
  const [integerPartRaw = '', decimalPartRaw = ''] = sanitized.split('.');
  const integerPart = integerPartRaw.replace(/^0+(?=\d)/, '');
  const formattedInteger = (integerPart || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimalPartRaw.length > 0 ? `${formattedInteger}.${decimalPartRaw.slice(0, 2)}` : formattedInteger;
}
