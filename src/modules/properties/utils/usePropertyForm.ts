import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type {
  PropertyRecord,
  CreatePropertyPayload,
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
  "precio",
  "precio_condicionado_monto",
  "cuota_mantenimiento",
  "precio_venta",
  "descuento_venta",
  "precio_renta",
  "descuento_renta",
  "precio_preventa",
  "descuento_preventa",
]);

const OPERATION_PRICE_FIELD_MAP = {
  Venta: "precio_venta",
  Renta: "precio_renta",
  Preventa: "precio_preventa",
} as const;

const OPERATION_DISCOUNT_FIELD_MAP = {
  Venta: "descuento_venta",
  Renta: "descuento_renta",
  Preventa: "descuento_preventa",
} as const;

type OperationOption = keyof typeof OPERATION_PRICE_FIELD_MAP;

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

function getOperationsFromProperty(
  property?: Pick<PropertyRecord, "esquema_comercial"> | null,
): OperationOption[] {
  if (!property || !Array.isArray(property.esquema_comercial)) {
    return ["Venta"];
  }

  const operations = property.esquema_comercial
    .map((scheme) => scheme?.tipo_operacion?.trim())
    .filter(
      (item): item is OperationOption =>
        item === "Venta" || item === "Renta" || item === "Preventa",
    );

  return operations.length > 0 ? operations : ["Venta"];
}

const INITIAL_FORM_STATE: FormState = {
  titulo: "",
  tipo_inmueble: "Casa",
  tipo_operacion: "Venta",
  operaciones: ["Venta"],
  descripcion: "",
  precio: "",
  precio_condicionado_descripcion: "",
  precio_condicionado_monto: "",
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
  if (!property) {
    return INITIAL_FORM_STATE;
  }

  const operaciones = getOperationsFromProperty(property);
  const operationValues = property.esquema_comercial.reduce(
    (accumulator, scheme) => {
      const operation = scheme.tipo_operacion?.trim() as OperationOption;
      if (
        operation !== "Venta" &&
        operation !== "Renta" &&
        operation !== "Preventa"
      ) {
        return accumulator;
      }

      const priceField = OPERATION_PRICE_FIELD_MAP[operation];
      const discountField = OPERATION_DISCOUNT_FIELD_MAP[operation];

      accumulator[priceField] =
        scheme.precio != null ? String(scheme.precio) : "";
      accumulator[discountField] =
        scheme.descuento_porcentaje != null
          ? String(scheme.descuento_porcentaje)
          : "";

      return accumulator;
    },
    {
      precio_venta: "",
      descuento_venta: "",
      precio_renta: "",
      descuento_renta: "",
      precio_preventa: "",
      descuento_preventa: "",
    } satisfies Pick<
      FormState,
      | "precio_venta"
      | "descuento_venta"
      | "precio_renta"
      | "descuento_renta"
      | "precio_preventa"
      | "descuento_preventa"
    >,
  );

  return {
    titulo: property.titulo ?? "",
    tipo_inmueble: property.tipo_inmueble ?? "Casa",
    tipo_operacion: operaciones.join(" / "),
    operaciones,
    descripcion: property.descripcion ?? "",
    precio: "",
    precio_condicionado_descripcion: "",
    precio_condicionado_monto: "",
    ...operationValues,
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
    aire_acondicionado: Boolean(property.caracteristicas?.aire_acondicionado),
    boiler: Boolean(property.caracteristicas?.boiler),
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

export function usePropertyForm(
  property: PropertyRecord | null | undefined,
  onSubmit: (data: {
    payload: Omit<CreatePropertyPayload, "creado_por_id">;
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

  function handleOperationToggle(option: string) {
    setForm((prev) => {
      const alreadySelected = prev.operaciones.includes(option);
      const operaciones = alreadySelected
        ? prev.operaciones.filter((item) => item !== option)
        : [...prev.operaciones, option];

      return {
        ...prev,
        operaciones,
        tipo_operacion: operaciones.join(" / "),
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
    const primaryOperation = selectedOperations[0];
    const isTerreno = form.tipo_inmueble.trim().toLowerCase() === "terreno";
    const commercialSchemes = selectedOperations.map((operation) => {
      const priceField = OPERATION_PRICE_FIELD_MAP[operation];
      const discountField = OPERATION_DISCOUNT_FIELD_MAP[operation];
      const price = parseFormattedNumber(form[priceField] as string);
      const discountValue = form[discountField] as string;
      const parsedDiscount = parseFormattedNumber(discountValue);

      return {
        tipo_operacion: operation,
        precio: price,
        ...(discountValue && !Number.isNaN(parsedDiscount)
          ? { descuento_porcentaje: parsedDiscount }
          : {}),
      };
    });

    const parsedNumbers = {
      precio:
        commercialSchemes.find(
          (scheme) => scheme.tipo_operacion === primaryOperation,
        )?.precio ?? 0,
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
      precio_condicionado: 0,
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

    const propertyData: Omit<
      CreatePropertyPayload,
      "creado_por_id" | "creador"
    > = {
      carpeta_id: property?.carpeta_id ?? "",
      titulo: form.titulo.trim(),
      tipo_inmueble: form.tipo_inmueble.trim(),
      descripcion: form.descripcion.trim() || undefined,
      esquema_comercial: commercialSchemes,
      tipos_pago: form.tipos_pago,
      estatus: form.estatus.trim(),
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
        num_ext: parsedNumbers.num_ext,
        num_int: form.num_int ? parsedNumbers.num_int : undefined,
        municipio: form.municipio.trim(),
        estado: form.estado.trim(),
        referencias: form.referencias.trim() || undefined,
      },
      caracteristicas: {
        banos: isTerreno ? 0 : parsedNumbers.banos,
        recamaras: isTerreno ? 0 : parsedNumbers.recamaras,
        estacionamiento: isTerreno ? 0 : parsedNumbers.estacionamiento,
        sala: isTerreno ? false : form.sala,
        comedor: isTerreno ? false : form.comedor,
        cocina: isTerreno ? false : form.cocina,
        area_servicio: isTerreno ? false : form.area_servicio,
        patio: isTerreno ? false : form.patio,
        jardin: isTerreno ? false : form.jardin,
        alberca: isTerreno ? false : form.alberca,
        terraza: isTerreno ? false : form.terraza,
        amueblado: isTerreno ? false : form.amueblado,
        bodega: isTerreno ? false : form.bodega,
        aire_acondicionado: isTerreno ? false : form.aire_acondicionado,
        boiler: isTerreno ? false : form.boiler,
      },
      imagenes: form.imagenes_existentes,
    };

    const submitResult = await onSubmit({
      payload: propertyData,
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
