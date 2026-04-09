import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type {
  PropertyRecord,
  CreatePropertyPayload,
  EsquemaComercial,
  UpdatePropertyPayload,
} from "@/interfaces/property.interface";
import {
  validatePropertyForm,
  type FormState,
  type FormErrors,
} from "./propertyValidations";

const NON_NEGATIVE_INTEGER_FIELD_NAMES = new Set([
  "cp",
  "mza",
  "lote",
  "num_ext",
  "num_int",
]);

const CURRENCY_FIELD_NAMES = new Set([
  "cuota_mantenimiento",
  "precio_venta",
  "descuento_venta",
  "precio_renta",
  "descuento_renta",
  "precio_preventa",
  "descuento_preventa",
]);

export type OperationOption = "Venta" | "Renta" | "Preventa";
export type PropertySubmitPayload =
  | Omit<CreatePropertyPayload, "creado_por_id">
  | UpdatePropertyPayload;

const TERRAIN_RESET_VALUES: Partial<FormState> = {
  construccion_m2: "0",
  recamaras: "0",
  banos: "0",
  estacionamiento: "0",
  pisos_tiene: "0",
  sala: false,
  comedor: false,
  cocina: false,
  area_servicio: false,
  patio: false,
  jardin: false,
  alberca: false,
  terraza: false,
  amueblado: false,
  bodega: false,
  aire_acondicionado: false,
  boiler: false,
};

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

const INITIAL_FORM_STATE: FormState = {
  titulo: "",
  tipo_inmueble: "Casa",
  operaciones: ["Venta"],
  descripcion: "",
  precio_venta: "",
  descuento_venta: "",
  precio_renta: "",
  descuento_renta: "",
  precio_preventa: "",
  descuento_preventa: "",
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
  terreno_m2: "0",
  construccion_m2: "0",
  frente: "0",
  fondo: "0",
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
  exclusiva: false,
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
  if (!property) {
    return INITIAL_FORM_STATE;
  }

  // Extraemos las operaciones y precios del arreglo esquema_comercial
  const operaciones: OperationOption[] = [];
  let precio_venta = "",
    descuento_venta = "";
  let precio_renta = "",
    descuento_renta = "";
  let precio_preventa = "",
    descuento_preventa = "";

  if (Array.isArray(property.esquema_comercial)) {
    property.esquema_comercial.forEach((esquema: EsquemaComercial) => {
      const tipo = esquema.tipo_operacion as OperationOption;

      if (tipo === "Venta" || tipo === "Renta" || tipo === "Preventa") {
        operaciones.push(tipo);

        const precioStr = esquema.precio != null ? String(esquema.precio) : "";
        const descStr =
          esquema.descuento_cantidad != null
            ? String(esquema.descuento_cantidad)
            : "";

        if (tipo === "Venta") {
          precio_venta = precioStr;
          descuento_venta = descStr;
        } else if (tipo === "Renta") {
          precio_renta = precioStr;
          descuento_renta = descStr;
        } else if (tipo === "Preventa") {
          precio_preventa = precioStr;
          descuento_preventa = descStr;
        }
      }
    });
  }

  if (operaciones.length === 0) operaciones.push("Venta");

  return {
    titulo: property.titulo ?? "",
    tipo_inmueble: property.tipo_inmueble ?? "Casa",
    operaciones,
    descripcion: property.descripcion ?? "",
    precio_venta,
    descuento_venta,
    precio_renta,
    descuento_renta,
    precio_preventa,
    descuento_preventa,
    tipos_pago: Array.isArray(property.tipos_pago) ? property.tipos_pago : [],
    estatus: property.estatus ?? "Disponible",
    etiquetas: Array.isArray(property.etiquetas)
      ? property.etiquetas.join(", ")
      : "",
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
        : "0",
    construccion_m2:
      property.medidas?.construccion_m2 != null
        ? String(property.medidas.construccion_m2)
        : "0",
    frente:
      property.medidas?.frente != null ? String(property.medidas.frente) : "0",
    fondo:
      property.medidas?.fondo != null ? String(property.medidas.fondo) : "0",
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
    aire_acondicionado: Boolean(property.caracteristicas?.aire_acondicionado),
    boiler: Boolean(property.caracteristicas?.boiler),
    exclusiva: Boolean(property.exclusiva),
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
    imagenes_existentes: Array.isArray(property.imagenes)
      ? property.imagenes
      : [],
  };
}

function buildInitialPayload(
  property: PropertyRecord,
): Omit<CreatePropertyPayload, "creado_por_id" | "creador" | "carpeta_id"> {
  const isTerreno = property.tipo_inmueble.trim().toLowerCase() === "terreno";

  return {
    titulo: property.titulo,
    tipo_inmueble: property.tipo_inmueble,
    descripcion: property.descripcion || undefined,
    exclusiva: Boolean(property.exclusiva),
    esquema_comercial: Array.isArray(property.esquema_comercial)
      ? property.esquema_comercial.map((item) => ({
          tipo_operacion: item.tipo_operacion,
          precio: item.precio,
          descuento_cantidad: item.descuento_cantidad ?? undefined,
        }))
      : [],
    tipos_pago: Array.isArray(property.tipos_pago) ? property.tipos_pago : [],
    estatus: property.estatus,
    tiene_gravamen: Boolean(property.tiene_gravamen),
    etiquetas: Array.isArray(property.etiquetas) ? property.etiquetas : [],
    cuota_mantenimiento: property.cuota_mantenimiento ?? undefined,
    comentarios: property.comentarios || undefined,
    pisos_tiene: property.pisos_tiene ?? undefined,
    servicios_instalaciones: property.servicios_instalaciones || undefined,
    amenidades: property.amenidades || undefined,
    medidas: {
      terreno_m2: property.medidas?.terreno_m2,
      construccion_m2: isTerreno
        ? 0
        : (property.medidas?.construccion_m2 ?? undefined),
      frente: property.medidas?.frente,
      fondo: property.medidas?.fondo,
    },
    direccion: {
      cp: property.direccion.cp,
      fraccionamiento: property.direccion.fraccionamiento,
      smz: property.direccion.smz ?? undefined,
      mza: property.direccion.mza ?? undefined,
      lote: property.direccion.lote ?? undefined,
      calle: property.direccion.calle,
      num_ext: property.direccion.num_ext ?? undefined,
      num_int: property.direccion.num_int ?? undefined,
      municipio: property.direccion.municipio,
      estado: property.direccion.estado,
      referencias: property.direccion.referencias || undefined,
    },
    caracteristicas: isTerreno
      ? undefined
      : {
          banos: property.caracteristicas?.banos ?? undefined,
          recamaras: property.caracteristicas?.recamaras ?? undefined,
          estacionamiento: property.caracteristicas?.estacionamiento ?? undefined,
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
          aire_acondicionado: Boolean(
            property.caracteristicas?.aire_acondicionado,
          ),
          boiler: Boolean(property.caracteristicas?.boiler),
        },
    imagenes: Array.isArray(property.imagenes) ? property.imagenes : [],
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function areValuesEqual(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((value, index) => areValuesEqual(value, right[index]))
    );
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    return Array.from(keys).every((key) =>
      areValuesEqual(left[key], right[key]),
    );
  }

  return false;
}

function getChangedPayload(
  current: Record<string, unknown>,
  initial: Record<string, unknown>,
): Record<string, unknown> {
  const changed: Record<string, unknown> = {};

  for (const key of Object.keys(current)) {
    const currentValue = current[key];
    const initialValue = initial[key];

    if (isPlainObject(currentValue) && isPlainObject(initialValue)) {
      const nestedChanges = getChangedPayload(currentValue, initialValue);
      if (Object.keys(nestedChanges).length > 0) {
        changed[key] = nestedChanges;
      }
      continue;
    }

    if (!areValuesEqual(currentValue, initialValue)) {
      changed[key] = currentValue;
    }
  }

  return changed;
}

export function usePropertyForm(
  property: PropertyRecord | null | undefined,
  onSubmit: (data: {
    payload: PropertySubmitPayload;
    files: File[];
  }) => Promise<string | null>,
) {
  const [form, setForm] = useState<FormState>(() => toFormState(property));
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setForm(toFormState(property));
    setSubmitError("");
    setErrors({});
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

    setForm((prev) => {
      if (name === "tipo_inmueble") {
        const nextType = String(value);
        if (nextType.trim().toLowerCase() === "terreno") {
          return { ...prev, tipo_inmueble: nextType, ...TERRAIN_RESET_VALUES };
        }
        return { ...prev, tipo_inmueble: nextType };
      }

      return { ...prev, [name]: value };
    });
  }

  function handlePaymentToggle(option: string) {
    setForm((prev) => ({
      ...prev,
      tipos_pago: prev.tipos_pago.includes(option)
        ? prev.tipos_pago.filter((item) => item !== option)
        : [...prev.tipos_pago, option],
    }));
  }

  function handleOperationToggle(option: OperationOption) {
    setForm((prev) => {
      const alreadySelected = prev.operaciones.includes(option);
      const operaciones = alreadySelected
        ? prev.operaciones.filter((item) => item !== option)
        : [...prev.operaciones, option];

      return {
        ...prev,
        operaciones,
      };
    });
  }

  function handleAddImages(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setForm((prev) => ({
        ...prev,
        imagenes: [...prev.imagenes, ...newFiles],
      }));
    }
    event.target.value = "";
  }

  function handleRemoveImage(indexToRemove: number) {
    setForm((prev) => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, index) => index !== indexToRemove),
    }));
  }

  function handleRemoveExistingImage(indexToRemove: number) {
    setForm((prev) => ({
      ...prev,
      imagenes_existentes: prev.imagenes_existentes.filter(
        (_, index) => index !== indexToRemove,
      ),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setErrors({});

    const selectedOperations: OperationOption[] =
      form.operaciones.length > 0
        ? (form.operaciones as OperationOption[])
        : ["Venta"];
    const isTerreno = form.tipo_inmueble.trim().toLowerCase() === "terreno";

    const parsedNumbers = {
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
      precio_venta: parseFormattedNumber(form.precio_venta),
      descuento_venta: parseFormattedNumber(form.descuento_venta),
      precio_renta: parseFormattedNumber(form.precio_renta),
      descuento_renta: parseFormattedNumber(form.descuento_renta),
      precio_preventa: parseFormattedNumber(form.precio_preventa),
      descuento_preventa: parseFormattedNumber(form.descuento_preventa),
    };

    const validationErrors = validatePropertyForm(form, parsedNumbers);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitError("Por favor, corrige los errores marcados en rojo.");
      return;
    }

    // CONSTRUIMOS EL ESQUEMA COMERCIAL DINÁMICAMENTE
    const esquema_comercial: EsquemaComercial[] = selectedOperations.map(
      (op) => {
        let precio = 0;
        let descuento_cantidad: number | undefined = undefined; // <-- Cambio aquí

        if (op === "Venta") {
          precio = parsedNumbers.precio_venta;
          descuento_cantidad = form.descuento_venta
            ? parsedNumbers.descuento_venta
            : undefined;
        } else if (op === "Renta") {
          precio = parsedNumbers.precio_renta;
          descuento_cantidad = form.descuento_renta
            ? parsedNumbers.descuento_renta
            : undefined;
        } else if (op === "Preventa") {
          precio = parsedNumbers.precio_preventa;
          descuento_cantidad = form.descuento_preventa
            ? parsedNumbers.descuento_preventa
            : undefined;
        }

        return {
          tipo_operacion: op,
          precio,
          descuento_cantidad,
        };
      },
    );

    const propertyData: Omit<
      CreatePropertyPayload,
      "creado_por_id" | "creador" | "carpeta_id"
    > = {
      titulo: form.titulo.trim(),
      tipo_inmueble: form.tipo_inmueble.trim(),
      descripcion: form.descripcion.trim() || undefined,
      esquema_comercial,
      tipos_pago: form.tipos_pago,
      estatus: form.estatus.trim(),
      exclusiva: form.exclusiva,
      tiene_gravamen: form.tiene_gravamen,
      etiquetas: form.etiquetas
        .split(",")
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
        construccion_m2: isTerreno ? 0 : parsedNumbers.construccion,
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
        num_ext: isTerreno && !form.num_ext ? undefined : parsedNumbers.num_ext,
        num_int: form.num_int ? parsedNumbers.num_int : undefined,
        municipio: form.municipio.trim(),
        estado: form.estado.trim(),
        referencias: form.referencias.trim() || undefined,
      },
      caracteristicas: isTerreno
        ? undefined
        : {
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
            aire_acondicionado: form.aire_acondicionado,
            boiler: form.boiler,
          },
      imagenes: form.imagenes_existentes,
    };

    let payload: PropertySubmitPayload = propertyData;

    if (property) {
      const initialPayload = buildInitialPayload(property);
      const changedPayload = getChangedPayload(
        propertyData as Record<string, unknown>,
        initialPayload as Record<string, unknown>,
      ) as UpdatePropertyPayload;

      if (property.carpeta_id) {
        changedPayload.carpeta_id = property.carpeta_id;
      }

      if (Object.keys(changedPayload).length === 0 && form.imagenes.length === 0) {
        setSubmitError("No se detectaron cambios para guardar.");
        return;
      }

      payload = changedPayload;
    }

    const submitResult = await onSubmit({
      payload,
      files: form.imagenes,
    });

    if (submitResult) {
      setSubmitError(submitResult);
    }
  }

  return {
    form,
    submitError,
    errors,
    handleInputChange,
    handlePaymentToggle,
    handleOperationToggle,
    handleAddImages,
    handleRemoveImage,
    handleRemoveExistingImage,
    handleSubmit,
  };
}
