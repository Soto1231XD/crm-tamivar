import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type {
  PropertyRecord,
  CreatePropertyPayload,
} from "@/interfaces/property.interface";
import { validatePropertyForm, type FormState } from "./propertyValidations";

// --- CONSTANTES Y FORMATOS ---
const NON_NEGATIVE_INTEGER_FIELD_NAMES = new Set([
  "cp",
  "mza",
  "lote",
  "num_ext",
  "num_int",
]);
const CURRENCY_FIELD_NAMES = new Set([
  "precio",
  "precio_condicionado_monto",
  "cuota_mantenimiento",
]);

function parseFormattedNumber(value: string): number {
  return Number(value.replace(/,/g, ""));
}

function formatCurrencyInput(value: string): string {
  const sanitized = value.replace(/[^\d.]/g, "");
  const [integerPartRaw = "", decimalPartRaw = ""] = sanitized.split(".");
  const integerPart = integerPartRaw.replace(/^0+(?=\d)/, "");
  const formattedInteger = (integerPart || "0").replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );
  return decimalPartRaw.length > 0
    ? `${formattedInteger}.${decimalPartRaw.slice(0, 2)}`
    : formattedInteger;
}

// --- ESTADO INICIAL ---
const INITIAL_FORM_STATE: FormState = {
  titulo: "",
  tipo_inmueble: "Casa",
  tipo_operacion: "Venta",
  descripcion: "",
  precio: "",
  precio_condicionado_descripcion: "",
  precio_condicionado_monto: "",
  tipos_pago: [],
  estatus: "Disponible",
  etiquetas: "",
  cp: "",
  fraccionamiento: "",
  smz: "",
  mza: "",
  lote: "",
  calle: "",
  num_ext: "",
  num_int: "",
  municipio: "",
  estado: "",
  referencias: "",
  terreno_m2: "1",
  construccion_m2: "1",
  frente: "1",
  fondo: "1",
  recamaras: "0",
  banos: "1",
  estacionamiento: "0",
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
  cuota_mantenimiento: "",
  comentarios: "",
  pisos_tiene: "",
  servicios_instalaciones: "",
  amenidades: "",
  imagenes: [],
  imagenes_existentes: [],
};

function toFormState(property?: PropertyRecord | null): FormState {
  if (!property) return INITIAL_FORM_STATE;

  return {
    titulo: property.titulo ?? "",
    tipo_inmueble: property.tipo_inmueble ?? "Casa",
    tipo_operacion: property.tipo_operacion ?? "Venta",
    descripcion: property.descripcion ?? "",
    precio: property.precio != null ? String(property.precio) : "",
    precio_condicionado_descripcion:
      property.precio_condicionado?.descripcion ?? "",
    precio_condicionado_monto:
      property.precio_condicionado?.monto != null
        ? String(property.precio_condicionado.monto)
        : "",
    tipos_pago: Array.isArray(property.tipos_pago) ? property.tipos_pago : [],
    estatus: property.estatus ?? "Disponible",
    etiquetas: Array.isArray(property.etiquetas) ? property.etiquetas.join(', ') : "",
    cp: property.direccion?.cp != null ? String(property.direccion.cp) : "",
    fraccionamiento: property.direccion?.fraccionamiento ?? "",
    smz: property.direccion?.smz != null ? String(property.direccion.smz) : "",
    mza: property.direccion?.mza != null ? String(property.direccion.mza) : "",
    lote:
      property.direccion?.lote != null ? String(property.direccion.lote) : "",
    calle: property.direccion?.calle ?? "",
    num_ext:
      property.direccion?.num_ext != null
        ? String(property.direccion.num_ext)
        : "",
    num_int:
      property.direccion?.num_int != null
        ? String(property.direccion.num_int)
        : "",
    municipio: property.direccion?.municipio ?? "",
    estado: property.direccion?.estado ?? "",
    referencias: property.direccion?.referencias ?? "",
    terreno_m2:
      property.medidas?.terreno_m2 != null
        ? String(property.medidas.terreno_m2)
        : "1",
    construccion_m2:
      property.medidas?.construccion_m2 != null
        ? String(property.medidas.construccion_m2)
        : "1",
    frente:
      property.medidas?.frente != null ? String(property.medidas.frente) : "1",
    fondo:
      property.medidas?.fondo != null ? String(property.medidas.fondo) : "1",
    recamaras:
      property.caracteristicas?.recamaras != null
        ? String(property.caracteristicas.recamaras)
        : "0",
    banos:
      property.caracteristicas?.banos != null
        ? String(property.caracteristicas.banos)
        : "1",
    estacionamiento:
      property.caracteristicas?.estacionamiento != null
        ? String(property.caracteristicas.estacionamiento)
        : "0",
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
    cuota_mantenimiento:
      property.cuota_mantenimiento != null
        ? String(property.cuota_mantenimiento)
        : "",
    comentarios: property.comentarios ?? "",
    pisos_tiene:
      property.pisos_tiene != null ? String(property.pisos_tiene) : "",
    servicios_instalaciones: property.servicios_instalaciones ?? "",
    amenidades: property.amenidades ?? "",
    imagenes: [],
    imagenes_existentes: Array.isArray(property.imagenes) ? property.imagenes : [],
  };
}

// --- EL CUSTOM HOOK ---
export function usePropertyForm(
  property: PropertyRecord | null | undefined,
  onSubmit: (data: {
    payload: Omit<CreatePropertyPayload, "creado_por_id">;
    files: File[];
  }) => Promise<string | null>,
) {
  const [form, setForm] = useState<FormState>(() => toFormState(property));
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setForm(toFormState(property));
    setSubmitError("");
  }, [property]);

  function handleInputChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name } = event.target;
    if (
      event.target instanceof HTMLInputElement &&
      CURRENCY_FIELD_NAMES.has(name)
    ) {
      setForm((prev) => ({
        ...prev,
        [name]: formatCurrencyInput(event.target.value),
      }));
      return;
    }
    if (
      event.target instanceof HTMLInputElement &&
      NON_NEGATIVE_INTEGER_FIELD_NAMES.has(name)
    ) {
      setForm((prev) => ({
        ...prev,
        [name]: event.target.value.replace(/\D/g, ""),
      }));
      return;
    }
    const value =
      event.target instanceof HTMLInputElement &&
      event.target.type === "checkbox"
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

  function handleAddImages(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setForm((prev) => ({
        ...prev,
        // Concatenamos las imágenes anteriores con las nuevas
        imagenes: [...prev.imagenes, ...newFiles], 
      }));
    }
    event.target.value = '';
  }

  function handleRemoveImage(indexToRemove: number) {
    setForm((prev) => ({
      ...prev,
      // Filtramos la imagen que coincide con el índice a eliminar
      imagenes: prev.imagenes.filter((_, index) => index !== indexToRemove),
    }));
  }

  // Función para borrar imágenes existentes
  function handleRemoveExistingImage(indexToRemove: number) {
    setForm((prev) => ({
      ...prev,
      imagenes_existentes: prev.imagenes_existentes.filter((_, index) => index !== indexToRemove),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    // Parsear los valores numéricos
    const parsedNumbers = {
      precio: parseFormattedNumber(form.precio),
      cp: Number(form.cp),
      num_ext: Number(form.num_ext),
      terreno: Number(form.terreno_m2),
      construccion: Number(form.construccion_m2),
      frente: Number(form.frente),
      fondo: Number(form.fondo),
      recamaras: Number(form.recamaras),
      banos: Number(form.banos),
      estacionamiento: Number(form.estacionamiento),
      smz: Number(form.smz),
      mza: Number(form.mza),
      lote: Number(form.lote),
      num_int: Number(form.num_int),
      precio_condicionado: parseFormattedNumber(form.precio_condicionado_monto),
    };

    // Validar con la función pura
    const errorMsg = validatePropertyForm(form, parsedNumbers);
    if (errorMsg) {
      setSubmitError(errorMsg);
      return;
    }

    // Estructurar el JSON estrictamente según CreatePropertyPayload
    const propertyData: Omit<CreatePropertyPayload, "creado_por_id"> = {
      titulo: form.titulo.trim(),
      tipo_inmueble: form.tipo_inmueble.trim(),
      tipo_operacion: form.tipo_operacion.trim(),
      descripcion: form.descripcion.trim() || undefined,
      precio: parsedNumbers.precio,
      precio_condicionado:
        form.precio_condicionado_monto &&
        !Number.isNaN(parsedNumbers.precio_condicionado)
          ? {
              descripcion:
                form.precio_condicionado_descripcion.trim() || undefined,
              monto: parsedNumbers.precio_condicionado,
            }
          : undefined,
      tipos_pago: form.tipos_pago,
      estatus: form.estatus.trim(),
      tiene_gravamen: form.tiene_gravamen,
      etiquetas: form.etiquetas
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      cuota_mantenimiento: form.cuota_mantenimiento
        ? parseFormattedNumber(form.cuota_mantenimiento)
        : undefined,
      comentarios: form.comentarios.trim() || undefined,
      pisos_tiene: form.pisos_tiene ? Number(form.pisos_tiene) : undefined,
      servicios_instalaciones: form.servicios_instalaciones.trim() || undefined,
      amenidades: form.amenidades.trim() || undefined,
      medidas: {
        terreno_m2: parsedNumbers.terreno,
        construccion_m2: parsedNumbers.construccion,
        frente: parsedNumbers.frente,
        fondo: parsedNumbers.fondo,
      },
      direccion: {
        cp: parsedNumbers.cp,
        fraccionamiento: form.fraccionamiento.trim(),
        smz: form.smz ? parsedNumbers.smz : undefined,
        mza: form.mza ? parsedNumbers.mza : undefined,
        lote: form.lote ? parsedNumbers.lote : undefined,
        calle: form.calle.trim(),
        num_ext: parsedNumbers.num_ext,
        num_int: form.num_int ? parsedNumbers.num_int : undefined,
        municipio: form.municipio.trim(),
        estado: form.estado.trim(),
        referencias: form.referencias.trim() || undefined,
      },
      caracteristicas: {
        banos: parsedNumbers.banos,
        recamaras: parsedNumbers.recamaras,
        estacionamiento: parsedNumbers.estacionamiento,
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
      imagenes: form.imagenes_existentes,
    };

    const submitResult = await onSubmit({
      payload: propertyData,
      files: form.imagenes, // Array de imágenes
    });

    if (submitResult) {
      setSubmitError(submitResult);
    }
  }

  return {
    form,
    submitError,
    handleInputChange,
    handlePaymentToggle,
    handleAddImages,
    handleRemoveImage,
    handleRemoveExistingImage,
    handleSubmit,
  };
}
