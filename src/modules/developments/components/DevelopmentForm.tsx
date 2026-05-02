import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type {
  CommercialScheme,
  CreateDevelopmentModelPayload,
  CreateDevelopmentPayload,
  DevelopmentFeatures,
  DevelopmentImageMetadata,
  DevelopmentMeasures,
  NewDevelopmentImage,
} from "@/interfaces/development.interface";
import {
  FieldInput,
  FieldSelect,
  FieldTextarea,
  OperationMultiSelect,
  PaymentMultiSelect,
  Toggle,
} from "./FormFields";
import { ImageGridUploader } from "./ImageGridUploader";
import {
  PAYMENT_OPTIONS,
  STATUS_OPTIONS,
} from "../utils/property-constants";
import { validatePropertyImageSelection } from "../utils/propertyValidations";

type DevelopmentFormProps = {
  title: string;
  submitLabel: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (data: {
    payload: CreateDevelopmentPayload;
    files: NewDevelopmentImage[];
  }) => Promise<string | null>;
};

type SectionCardProps = {
  step: string;
  title: string;
  description: string;
  children: ReactNode;
};

type OperationOption = "Preventa" | "Entrega inmediata";

type DevelopmentModelFormState = {
  id: string;
  nombre: string;
  descripcion: string;
  operaciones: OperationOption[];
  precio_preventa: string;
  descuento_preventa: string;
  precio_entrega_inmediata: string;
  descuento_entrega_inmediata: string;
  tipos_pago: string[];
  terreno_m2: string;
  construccion_m2: string;
  recamaras: string;
  banos: string;
  estacionamiento: string;
  comentarios: string;
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
  imagenes: NewDevelopmentImage[];
};

type DevelopmentFormState = {
  titulo: string;
  descripcion: string;
  operaciones: OperationOption[];
  entrega_inmediata: boolean;
  fecha_entrega: string;
  precio_preventa: string;
  descuento_preventa: string;
  precio_entrega_inmediata: string;
  descuento_entrega_inmediata: string;
  tipos_pago: string[];
  estatus: string;
  etiquetas: string;
  calle: string;
  num_ext: string;
  num_int: string;
  fraccionamiento: string;
  estado: string;
  municipio: string;
  smz: string;
  mza: string;
  lote: string;
  cp: string;
  enlace_direccion: string;
  referencias: string;
  terreno_m2: string;
  construccion_m2: string;
  frente: string;
  fondo: string;
  recamaras: string;
  banos: string;
  estacionamiento: string;
  pisos_tiene: string;
  cuota_mantenimiento: string;
  servicios_instalaciones: string;
  amenidades: string;
  comentarios: string;
  imagenes: NewDevelopmentImage[];
  modelos: DevelopmentModelFormState[];
};

type FormErrors = Record<string, string>;

const DEVELOPMENT_OPERATION_OPTIONS: readonly OperationOption[] = [
  "Preventa",
  "Entrega inmediata",
];

const OPERATION_BLOCKS: Array<{
  key: OperationOption;
  title: string;
  priceName: "precio_preventa" | "precio_entrega_inmediata";
  discountName: "descuento_preventa" | "descuento_entrega_inmediata";
}> = [
  {
    key: "Preventa",
    title: "Preventa",
    priceName: "precio_preventa",
    discountName: "descuento_preventa",
  },
  {
    key: "Entrega inmediata",
    title: "Entrega inmediata",
    priceName: "precio_entrega_inmediata",
    discountName: "descuento_entrega_inmediata",
  },
];

const UPPERCASE_ADDRESS_FIELD_NAMES = new Set([
  "calle",
  "fraccionamiento",
  "estado",
  "municipio",
  "referencias",
]);

const CURRENCY_FIELD_NAMES = new Set([
  "precio_preventa",
  "descuento_preventa",
  "precio_entrega_inmediata",
  "descuento_entrega_inmediata",
  "cuota_mantenimiento",
]);

const MODEL_CURRENCY_FIELD_NAMES = new Set([
  "precio_preventa",
  "descuento_preventa",
  "precio_entrega_inmediata",
  "descuento_entrega_inmediata",
]);

const INITIAL_FORM: DevelopmentFormState = {
  titulo: "",
  descripcion: "",
  operaciones: ["Preventa"],
  entrega_inmediata: true,
  fecha_entrega: "",
  precio_preventa: "",
  descuento_preventa: "",
  precio_entrega_inmediata: "",
  descuento_entrega_inmediata: "",
  tipos_pago: [],
  estatus: "Disponible",
  etiquetas: "",
  calle: "",
  num_ext: "",
  num_int: "",
  fraccionamiento: "",
  estado: "",
  municipio: "",
  smz: "",
  mza: "",
  lote: "",
  cp: "",
  enlace_direccion: "",
  referencias: "",
  terreno_m2: "0",
  construccion_m2: "0",
  frente: "0",
  fondo: "0",
  recamaras: "0",
  banos: "0",
  estacionamiento: "0",
  pisos_tiene: "0",
  cuota_mantenimiento: "",
  servicios_instalaciones: "",
  amenidades: "",
  comentarios: "",
  imagenes: [],
  modelos: [],
};

function createEmptyModel(): DevelopmentModelFormState {
  return {
    id: crypto.randomUUID(),
    nombre: "",
    descripcion: "",
    operaciones: ["Preventa"],
    precio_preventa: "",
    descuento_preventa: "",
    precio_entrega_inmediata: "",
    descuento_entrega_inmediata: "",
    tipos_pago: [],
    terreno_m2: "0",
    construccion_m2: "0",
    recamaras: "0",
    banos: "0",
    estacionamiento: "0",
    comentarios: "",
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
    imagenes: [],
  };
}

function SectionCard({ step, title, description, children }: SectionCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#312C85] text-sm font-bold text-white shadow-sm">
          {step}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
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

function parseFormattedNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getDefaultImageTitle(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function ensureSinglePrimary<T extends { principal: boolean }>(images: T[]): T[] {
  if (images.length === 0) return images;

  let primaryFound = false;
  const normalized = images.map((image) => {
    if (!primaryFound && image.principal) {
      primaryFound = true;
      return image;
    }

    return { ...image, principal: false };
  });

  if (!primaryFound) {
    normalized[0] = { ...normalized[0], principal: true };
  }

  return normalized;
}

function buildCommercialSchemes(source: {
  operaciones: OperationOption[];
  precio_preventa: string;
  descuento_preventa: string;
  precio_entrega_inmediata: string;
  descuento_entrega_inmediata: string;
}): CommercialScheme[] {
  return source.operaciones.map((operation) => {
    const price =
      operation === "Entrega inmediata"
        ? parseFormattedNumber(source.precio_entrega_inmediata)
        : parseFormattedNumber(source.precio_preventa);

    const discount =
      operation === "Entrega inmediata"
        ? parseFormattedNumber(source.descuento_entrega_inmediata)
        : parseFormattedNumber(source.descuento_preventa);

    return {
      tipo_operacion: operation,
      precio: price ?? 0,
      descuento_cantidad: discount,
    };
  });
}

function buildMeasures(source: {
  terreno_m2: string;
  construccion_m2: string;
  frente?: string;
  fondo?: string;
}): DevelopmentMeasures {
  return {
    terreno_m2: parseFormattedNumber(source.terreno_m2),
    construccion_m2: parseFormattedNumber(source.construccion_m2),
    frente: parseFormattedNumber(source.frente ?? ""),
    fondo: parseFormattedNumber(source.fondo ?? ""),
  };
}

function buildFeatures(source: {
  recamaras: string;
  banos: string;
  estacionamiento: string;
  sala?: boolean;
  comedor?: boolean;
  cocina?: boolean;
  area_servicio?: boolean;
  patio?: boolean;
  jardin?: boolean;
  alberca?: boolean;
  terraza?: boolean;
  amueblado?: boolean;
  bodega?: boolean;
  aire_acondicionado?: boolean;
  boiler?: boolean;
}): DevelopmentFeatures {
  return {
    recamaras: parseFormattedNumber(source.recamaras),
    banos: parseFormattedNumber(source.banos),
    estacionamiento: parseFormattedNumber(source.estacionamiento),
    sala: Boolean(source.sala),
    comedor: Boolean(source.comedor),
    cocina: Boolean(source.cocina),
    area_servicio: Boolean(source.area_servicio),
    patio: Boolean(source.patio),
    jardin: Boolean(source.jardin),
    alberca: Boolean(source.alberca),
    terraza: Boolean(source.terraza),
    amueblado: Boolean(source.amueblado),
    bodega: Boolean(source.bodega),
    aire_acondicionado: Boolean(source.aire_acondicionado),
    boiler: Boolean(source.boiler),
  };
}

function getSelectedOperationBlocks(operations: OperationOption[]) {
  return OPERATION_BLOCKS.filter((operation) => operations.includes(operation.key));
}

function isModelReady(model: DevelopmentModelFormState) {
  const hasName = model.nombre.trim().length > 0;
  const hasOperations = model.operaciones.length > 0;
  const hasImages = model.imagenes.length > 0;
  const hasPrices = model.operaciones.every((operation) => {
    const price =
      operation === "Entrega inmediata"
        ? parseFormattedNumber(model.precio_entrega_inmediata)
        : parseFormattedNumber(model.precio_preventa);
    return (price ?? 0) > 0;
  });

  return hasName && hasOperations && hasImages && hasPrices;
}

export function DevelopmentForm({
  title,
  submitLabel,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: DevelopmentFormProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<DevelopmentFormState>(INITIAL_FORM);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name } = event.target;
    const nextValue =
      event.target instanceof HTMLInputElement && event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setForm((prev) => {
      if (
        event.target instanceof HTMLInputElement &&
        CURRENCY_FIELD_NAMES.has(name)
      ) {
        return { ...prev, [name]: formatCurrencyInput(String(event.target.value)) };
      }

      if (UPPERCASE_ADDRESS_FIELD_NAMES.has(name)) {
        return { ...prev, [name]: String(event.target.value).toUpperCase() };
      }

      return { ...prev, [name]: nextValue };
    });
  }

  function handleOperationToggle(option: OperationOption) {
    setForm((prev) => ({
      ...prev,
      operaciones: prev.operaciones.includes(option)
        ? prev.operaciones.filter((item) => item !== option)
        : [...prev.operaciones, option],
    }));
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
    if (!event.target.files) return;
    const files = Array.from(event.target.files);

    const validation = validatePropertyImageSelection(
      files,
      form.imagenes.length,
      form.imagenes.reduce((sum, image) => sum + image.file.size, 0),
    );

    if (validation) {
      setSubmitError(validation);
      setErrors((prev) => ({ ...prev, imagenes: validation }));
      event.target.value = "";
      return;
    }

    setForm((prev) => ({
      ...prev,
      imagenes: ensureSinglePrimary([
        ...prev.imagenes,
        ...files.map((file, index) => ({
          file,
          titulo: getDefaultImageTitle(file.name),
          principal: prev.imagenes.length === 0 && index === 0,
        })),
      ]),
    }));
    event.target.value = "";
  }

  function handleRemoveImage(index: number) {
    setForm((prev) => ({
      ...prev,
      imagenes: ensureSinglePrimary(
        prev.imagenes.filter((_, currentIndex) => currentIndex !== index),
      ),
    }));
  }

  function handleImageTitleChange(index: number, titulo: string) {
    setForm((prev) => ({
      ...prev,
      imagenes: prev.imagenes.map((image, currentIndex) =>
        currentIndex === index ? { ...image, titulo } : image,
      ),
    }));
  }

  function handleSetPrimaryImage(type: "new" | "existing", index: number) {
    if (type !== "new") return;

    setForm((prev) => ({
      ...prev,
      imagenes: prev.imagenes.map((image, currentIndex) => ({
        ...image,
        principal: currentIndex === index,
      })),
    }));
  }

  function handleModelInputChange(
    modelId: string,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name } = event.target;
    const nextValue =
      event.target instanceof HTMLInputElement && event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setForm((prev) => ({
      ...prev,
      modelos: prev.modelos.map((model) => {
        if (model.id !== modelId) return model;

        if (
          event.target instanceof HTMLInputElement &&
          MODEL_CURRENCY_FIELD_NAMES.has(name)
        ) {
          return { ...model, [name]: formatCurrencyInput(String(event.target.value)) };
        }

        return { ...model, [name]: nextValue };
      }),
    }));
  }

  function handleModelOperationToggle(modelId: string, option: OperationOption) {
    setForm((prev) => ({
      ...prev,
      modelos: prev.modelos.map((model) =>
        model.id === modelId
          ? {
              ...model,
              operaciones: model.operaciones.includes(option)
                ? model.operaciones.filter((item) => item !== option)
                : [...model.operaciones, option],
            }
          : model,
      ),
    }));
  }

  function handleModelPaymentToggle(modelId: string, option: string) {
    setForm((prev) => ({
      ...prev,
      modelos: prev.modelos.map((model) =>
        model.id === modelId
          ? {
              ...model,
              tipos_pago: model.tipos_pago.includes(option)
                ? model.tipos_pago.filter((item) => item !== option)
                : [...model.tipos_pago, option],
            }
          : model,
      ),
    }));
  }

  function handleAddModel() {
    setForm((prev) => {
      if (prev.modelos.length >= 6) return prev;

      const previousModel = prev.modelos[prev.modelos.length - 1];
      if (previousModel && !isModelReady(previousModel)) {
        setErrors((current) => ({
          ...current,
          [`modelo_${previousModel.id}_bloqueado`]:
            "Completa el modelo actual antes de agregar otro.",
        }));
        setSubmitError(
          "Completa el modelo actual antes de agregar un nuevo modelo.",
        );
        return prev;
      }

      return { ...prev, modelos: [...prev.modelos, createEmptyModel()] };
    });
  }

  function handleRemoveModel(modelId: string) {
    setForm((prev) => ({
      ...prev,
      modelos: prev.modelos.filter((model) => model.id !== modelId),
    }));
  }

  function handleAddModelImages(
    modelId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    if (!event.target.files) return;
    const files = Array.from(event.target.files);
    const model = form.modelos.find((item) => item.id === modelId);
    if (!model) return;

    const validation = validatePropertyImageSelection(
      files,
      model.imagenes.length,
      model.imagenes.reduce((sum, image) => sum + image.file.size, 0),
    );

    if (validation) {
      setSubmitError(validation);
      setErrors((prev) => ({ ...prev, [`modelo_${modelId}_imagenes`]: validation }));
      event.target.value = "";
      return;
    }

    setForm((prev) => ({
      ...prev,
      modelos: prev.modelos.map((item) =>
        item.id === modelId
          ? {
              ...item,
              imagenes: ensureSinglePrimary([
                ...item.imagenes,
                ...files.map((file, index) => ({
                  file,
                  titulo: getDefaultImageTitle(file.name),
                  principal: item.imagenes.length === 0 && index === 0,
                })),
              ]),
            }
          : item,
      ),
    }));
    event.target.value = "";
  }

  function handleRemoveModelImage(modelId: string, index: number) {
    setForm((prev) => ({
      ...prev,
      modelos: prev.modelos.map((model) =>
        model.id === modelId
          ? {
              ...model,
              imagenes: ensureSinglePrimary(
                model.imagenes.filter((_, currentIndex) => currentIndex !== index),
              ),
            }
          : model,
      ),
    }));
  }

  function handleModelImageTitleChange(
    modelId: string,
    index: number,
    titulo: string,
  ) {
    setForm((prev) => ({
      ...prev,
      modelos: prev.modelos.map((model) =>
        model.id === modelId
          ? {
              ...model,
              imagenes: model.imagenes.map((image, currentIndex) =>
                currentIndex === index ? { ...image, titulo } : image,
              ),
            }
          : model,
      ),
    }));
  }

  function handleSetPrimaryModelImage(modelId: string, index: number) {
    setForm((prev) => ({
      ...prev,
      modelos: prev.modelos.map((model) =>
        model.id === modelId
          ? {
              ...model,
              imagenes: model.imagenes.map((image, currentIndex) => ({
                ...image,
                principal: currentIndex === index,
              })),
            }
          : model,
      ),
    }));
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};

    if (!form.titulo.trim()) nextErrors.titulo = "El título es obligatorio.";
    if (form.operaciones.length === 0) {
      nextErrors.operaciones = "Selecciona al menos una operación.";
    }
    if (!form.fraccionamiento.trim()) {
      nextErrors.fraccionamiento = "El fraccionamiento es obligatorio.";
    }
    if (!form.estado.trim()) nextErrors.estado = "El estado es obligatorio.";
    if (!form.municipio.trim()) {
      nextErrors.municipio = "El municipio es obligatorio.";
    }
    if (!form.smz.trim()) nextErrors.smz = "La SMZ es obligatoria.";
    if (!form.entrega_inmediata && !form.fecha_entrega) {
      nextErrors.fecha_entrega = "Indica la fecha de entrega del desarrollo.";
    }
    if (form.imagenes.length === 0) {
      nextErrors.imagenes = "Agrega al menos una imagen del desarrollo.";
    }
    if (form.modelos.length === 0) {
      nextErrors.modelos = "Agrega al menos un modelo al desarrollo.";
    }

    const hasDevelopmentPrices = form.operaciones.every((operation) => {
      const price =
        operation === "Entrega inmediata"
          ? parseFormattedNumber(form.precio_entrega_inmediata)
          : parseFormattedNumber(form.precio_preventa);
      return (price ?? 0) > 0;
    });

    if (!hasDevelopmentPrices) {
      nextErrors.precios = "Completa el precio de cada operación del desarrollo.";
    }

    form.modelos.forEach((model) => {
      if (!model.nombre.trim()) {
        nextErrors[`modelo_${model.id}_nombre`] = "El nombre del modelo es obligatorio.";
      }
      if (model.operaciones.length === 0) {
        nextErrors[`modelo_${model.id}_operaciones`] =
          "Selecciona al menos una operación.";
      }

      const hasModelPrices = model.operaciones.every((operation) => {
        const price =
          operation === "Entrega inmediata"
            ? parseFormattedNumber(model.precio_entrega_inmediata)
            : parseFormattedNumber(model.precio_preventa);
        return (price ?? 0) > 0;
      });

      if (!hasModelPrices) {
        nextErrors[`modelo_${model.id}_precios`] =
          "Completa el precio de cada operación del modelo.";
      }
      if (model.imagenes.length === 0) {
        nextErrors[`modelo_${model.id}_imagenes`] =
          "Agrega al menos una imagen del modelo.";
      }
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitError("Por favor, corrige los campos marcados antes de guardar.");
      return false;
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    const modelos: CreateDevelopmentModelPayload[] = form.modelos.map((model) => ({
      nombre: model.nombre.trim(),
      descripcion: model.descripcion.trim() || undefined,
      esquema_comercial: buildCommercialSchemes(model),
      tipos_pago: model.tipos_pago,
      medidas: buildMeasures(model),
      caracteristicas: buildFeatures(model),
      comentarios: model.comentarios.trim() || undefined,
      imagenes_nuevas_metadata: ensureSinglePrimary(
        model.imagenes.map(
          (image): DevelopmentImageMetadata => ({
            titulo: image.titulo.trim(),
            principal: Boolean(image.principal),
          }),
        ),
      ),
    }));

    const payload: CreateDevelopmentPayload = {
      titulo: form.titulo.trim(),
      tipo_inmueble: "Desarrollo",
      esquema_comercial: buildCommercialSchemes(form),
      descripcion: form.descripcion.trim() || undefined,
      tipos_pago: form.tipos_pago,
      estatus: form.estatus.trim(),
      etiquetas: form.etiquetas
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      exclusiva: false,
      tiene_gravamen: false,
      entrega_inmediata: form.entrega_inmediata,
      fecha_entrega: form.entrega_inmediata || !form.fecha_entrega ? undefined : form.fecha_entrega,
      cuota_mantenimiento: parseFormattedNumber(form.cuota_mantenimiento),
      comentarios: form.comentarios.trim() || undefined,
      pisos_tiene: parseFormattedNumber(form.pisos_tiene),
      servicios_instalaciones: form.servicios_instalaciones.trim() || undefined,
      amenidades: form.amenidades.trim() || undefined,
      enlace_direccion: form.enlace_direccion.trim() || undefined,
      medidas: buildMeasures(form),
      direccion: {
        cp: parseFormattedNumber(form.cp),
        fraccionamiento: form.fraccionamiento.trim(),
        smz: parseFormattedNumber(form.smz),
        mza: parseFormattedNumber(form.mza),
        lote: parseFormattedNumber(form.lote),
        calle: form.calle.trim() || undefined,
        num_ext: parseFormattedNumber(form.num_ext),
        num_int: parseFormattedNumber(form.num_int),
        municipio: form.municipio.trim(),
        estado: form.estado.trim(),
        referencias: form.referencias.trim() || undefined,
      },
      caracteristicas: {},
      imagenes_nuevas_metadata: ensureSinglePrimary(
        form.imagenes.map(
          (image): DevelopmentImageMetadata => ({
            titulo: image.titulo.trim(),
            principal: Boolean(image.principal),
          }),
        ),
      ),
      modelos,
    };

    const files: NewDevelopmentImage[] = [
      ...form.imagenes,
      ...form.modelos.flatMap((model) => model.imagenes),
    ];

    const result = await onSubmit({ payload, files });
    if (result) setSubmitError(result);
  }

  const selectedOperationBlocks = getSelectedOperationBlocks(form.operaciones);

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate("/modulos/desarrollos")}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Volver a desarrollos
      </button>

      <header className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Formulario de desarrollo
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[2rem]">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Captura la ficha general del desarrollo y debajo agrega sus modelos con
          precios, medidas, características e imágenes.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <SectionCard
          step="1"
          title="Información general"
          description="Define la identidad principal del desarrollo y cómo se presentará en el catálogo."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FieldInput
              label="Titulo"
              name="titulo"
              value={form.titulo}
              onChange={handleInputChange}
              required
              error={errors.titulo}
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Tipo de inmueble
              </span>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-[#312C85]">
                Desarrollo
              </div>
            </div>
            <OperationMultiSelect
              label="Tipo de operación"
              selectedValues={form.operaciones}
              options={DEVELOPMENT_OPERATION_OPTIONS}
              onToggle={handleOperationToggle}
              required
              error={errors.operaciones}
              className="md:col-span-2"
            />
            <FieldSelect
              label="Estado"
              name="estatus"
              value={form.estatus}
              onChange={handleInputChange}
              options={STATUS_OPTIONS.filter((option) => option !== "Todos los estados")}
            />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Entrega
                </p>
                <h4 className="mt-1 text-base font-semibold text-slate-900">
                  Disponibilidad del desarrollo
                </h4>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Toggle
                  name="entrega_inmediata"
                  checked={form.entrega_inmediata}
                  onChange={handleInputChange}
                  label="¿Es con entrega inmediata?"
                />
                {!form.entrega_inmediata ? (
                  <FieldInput
                    label="Fecha de entrega"
                    name="fecha_entrega"
                    value={form.fecha_entrega}
                    onChange={handleInputChange}
                    type="date"
                    error={errors.fecha_entrega}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-500">
                    Si el desarrollo no es inmediato, aquí se capturará la fecha comprometida.
                  </div>
                )}
              </div>
            </div>
            <FieldTextarea
              label="Descripción"
              name="descripcion"
              value={form.descripcion}
              onChange={handleInputChange}
              className="md:col-span-2"
            />
            <FieldTextarea
              label="Etiquetas"
              name="etiquetas"
              value={form.etiquetas}
              onChange={handleInputChange}
              className="md:col-span-2"
            />
          </div>
        </SectionCard>

        <SectionCard
          step="2"
          title="Precio y condiciones"
          description="Define los esquemas comerciales base del desarrollo."
        >
          <div className="space-y-4">
            {selectedOperationBlocks.map((operation) => (
              <div
                key={operation.key}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Operación
                  </p>
                  <h4 className="mt-1 text-base font-semibold text-slate-900">
                    {operation.title}
                  </h4>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FieldInput
                    label={`Precio de ${operation.title.toLowerCase()} (MXN)`}
                    name={operation.priceName}
                    value={form[operation.priceName]}
                    onChange={handleInputChange}
                    type="text"
                    inputMode="decimal"
                  />
                  <FieldInput
                    label="Descuento ($)"
                    name={operation.discountName}
                    value={form[operation.discountName]}
                    onChange={handleInputChange}
                    type="text"
                    inputMode="decimal"
                  />
                </div>
              </div>
            ))}

            {errors.precios ? (
              <p className="text-sm font-medium text-red-600">{errors.precios}</p>
            ) : null}

            <PaymentMultiSelect
              label="Tipos de pago"
              selectedValues={form.tipos_pago}
              options={PAYMENT_OPTIONS}
              onToggle={handlePaymentToggle}
              className="md:col-span-2"
            />
          </div>
        </SectionCard>

        <SectionCard
          step="3"
          title="Dirección"
          description="Ubica el desarrollo con datos claros y referencias fáciles de consultar."
        >
          <div className="grid gap-4 md:grid-cols-4">
            <FieldInput
              label="Calle"
              name="calle"
              value={form.calle}
              onChange={handleInputChange}
              className="md:col-span-2"
            />
            <FieldInput
              label="Numero exterior"
              name="num_ext"
              value={form.num_ext}
              onChange={handleInputChange}
              type="number"
            />
            <FieldInput
              label="Numero interior"
              name="num_int"
              value={form.num_int}
              onChange={handleInputChange}
              type="number"
            />
            <FieldInput
              label="Fraccionamiento"
              name="fraccionamiento"
              value={form.fraccionamiento}
              onChange={handleInputChange}
              required
              error={errors.fraccionamiento}
              className="md:col-span-2"
            />
            <FieldInput
              label="Estado"
              name="estado"
              value={form.estado}
              onChange={handleInputChange}
              required
              error={errors.estado}
            />
            <FieldInput
              label="Municipio"
              name="municipio"
              value={form.municipio}
              onChange={handleInputChange}
              required
              error={errors.municipio}
            />
            <FieldInput
              label="Region (SMZ)"
              name="smz"
              value={form.smz}
              onChange={handleInputChange}
              required
              error={errors.smz}
              type="number"
            />
            <FieldInput
              label="Manzana (MZ)"
              name="mza"
              value={form.mza}
              onChange={handleInputChange}
              type="number"
            />
            <FieldInput
              label="Lote"
              name="lote"
              value={form.lote}
              onChange={handleInputChange}
              type="number"
            />
            <FieldInput
              label="Código postal"
              name="cp"
              value={form.cp}
              onChange={handleInputChange}
              type="number"
            />
            <FieldInput
              label="Enlace de Google Maps"
              name="enlace_direccion"
              value={form.enlace_direccion}
              onChange={handleInputChange}
              className="md:col-span-4"
            />
            <FieldTextarea
              label="Referencias"
              name="referencias"
              value={form.referencias}
              onChange={handleInputChange}
              className="md:col-span-4"
            />
          </div>
        </SectionCard>

        <SectionCard
          step="4"
          title="Medidas y distribución"
          description="Registra medidas generales y las amenidades principales del desarrollo."
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <FieldInput label="Terreno (m2)" name="terreno_m2" value={form.terreno_m2} onChange={handleInputChange} type="number" />
            <FieldInput label="Construcción (m2)" name="construccion_m2" value={form.construccion_m2} onChange={handleInputChange} type="number" />
            <FieldInput label="Frente" name="frente" value={form.frente} onChange={handleInputChange} type="number" />
            <FieldInput label="Fondo" name="fondo" value={form.fondo} onChange={handleInputChange} type="number" />
            <FieldInput label="Recamaras" name="recamaras" value={form.recamaras} onChange={handleInputChange} type="number" />
            <FieldInput label="Baños" name="banos" value={form.banos} onChange={handleInputChange} type="number" />
            <FieldInput label="Estacionamiento" name="estacionamiento" value={form.estacionamiento} onChange={handleInputChange} type="number" />
            <FieldInput label="Pisos" name="pisos_tiene" value={form.pisos_tiene} onChange={handleInputChange} type="number" />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Identidad del desarrollo
              </p>
              <h4 className="mt-1 text-base font-semibold text-slate-900">
                Amenidades principales
              </h4>
            </div>

            <FieldTextarea
              label="Amenidades principales"
              name="amenidades"
              value={form.amenidades}
              onChange={handleInputChange}
            />
          </div>
        </SectionCard>

        <SectionCard
          step="5"
          title="Extras e imágenes"
          description="Carga imágenes generales y agrega información complementaria del desarrollo."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FieldInput
              label="Cuota de mantenimiento (MXN)"
              name="cuota_mantenimiento"
              value={form.cuota_mantenimiento}
              onChange={handleInputChange}
              type="text"
              inputMode="decimal"
              className="md:col-span-2"
            />
            <FieldTextarea
              label="Servicios e instalaciones"
              name="servicios_instalaciones"
              value={form.servicios_instalaciones}
              onChange={handleInputChange}
              className="md:col-span-2"
            />
            <FieldTextarea
              label="Comentarios"
              name="comentarios"
              value={form.comentarios}
              onChange={handleInputChange}
              className="md:col-span-2"
            />
            <ImageGridUploader
              images={form.imagenes}
              onAddImages={handleAddImages}
              onRemoveImage={handleRemoveImage}
              onUpdateImageTitle={handleImageTitleChange}
              onSetPrimaryImage={handleSetPrimaryImage}
              error={errors.imagenes}
              label="Imágenes del desarrollo"
            />
          </div>
        </SectionCard>

        <SectionCard
          step="6"
          title="Modelos del desarrollo"
          description="Agrega hasta 6 modelos con sus propios precios, características e imágenes."
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-600">
                  Cada desarrollo puede manejar uno o varios modelos.
                </p>
                {errors.modelos ? (
                  <p className="mt-1 text-sm font-medium text-red-600">{errors.modelos}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleAddModel}
                disabled={form.modelos.length >= 6}
                className="rounded-xl bg-[#312C85] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Agregar modelo
              </button>
            </div>

            {form.modelos.map((model, index) => {
              const modelOperationBlocks = getSelectedOperationBlocks(model.operaciones);

              return (
                <section
                  key={model.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Modelo {index + 1}
                      </p>
                      <h4 className="mt-1 text-base font-semibold text-slate-900">
                        {model.nombre.trim() || "Nuevo modelo"}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveModel(model.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"
                    >
                      Quitar modelo
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldInput
                      label="Nombre del modelo"
                      name="nombre"
                      value={model.nombre}
                      onChange={(event) => handleModelInputChange(model.id, event)}
                      required
                      error={errors[`modelo_${model.id}_nombre`]}
                    />
                    <FieldTextarea
                      label="Descripción"
                      name="descripcion"
                      value={model.descripcion}
                      onChange={(event) => handleModelInputChange(model.id, event)}
                    />

                    <OperationMultiSelect
                      label="Operaciones del modelo"
                      selectedValues={model.operaciones}
                      options={DEVELOPMENT_OPERATION_OPTIONS}
                      onToggle={(option) => handleModelOperationToggle(model.id, option)}
                      required
                      error={errors[`modelo_${model.id}_operaciones`]}
                      className="md:col-span-2"
                    />

                    {modelOperationBlocks.map((operation) => (
                      <div
                        key={`${model.id}-${operation.key}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2"
                      >
                        <div className="mb-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Operación
                          </p>
                          <h5 className="mt-1 text-sm font-semibold text-slate-900">
                            {operation.title}
                          </h5>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <FieldInput
                            label={`Precio de ${operation.title.toLowerCase()} (MXN)`}
                            name={operation.priceName}
                            value={model[operation.priceName]}
                            onChange={(event) => handleModelInputChange(model.id, event)}
                            type="text"
                            inputMode="decimal"
                          />
                          <FieldInput
                            label="Descuento ($)"
                            name={operation.discountName}
                            value={model[operation.discountName]}
                            onChange={(event) => handleModelInputChange(model.id, event)}
                            type="text"
                            inputMode="decimal"
                          />
                        </div>
                      </div>
                    ))}

                    <PaymentMultiSelect
                      label="Tipos de pago del modelo"
                      selectedValues={model.tipos_pago}
                      options={PAYMENT_OPTIONS}
                      onToggle={(option) => handleModelPaymentToggle(model.id, option)}
                      className="md:col-span-2"
                    />

                    <FieldInput label="Terreno (m2)" name="terreno_m2" value={model.terreno_m2} onChange={(event) => handleModelInputChange(model.id, event)} type="number" />
                    <FieldInput label="Construcción (m2)" name="construccion_m2" value={model.construccion_m2} onChange={(event) => handleModelInputChange(model.id, event)} type="number" />
                    <FieldInput label="Recamaras" name="recamaras" value={model.recamaras} onChange={(event) => handleModelInputChange(model.id, event)} type="number" />
                    <FieldInput label="Baños" name="banos" value={model.banos} onChange={(event) => handleModelInputChange(model.id, event)} type="number" />
                    <FieldInput label="Estacionamiento" name="estacionamiento" value={model.estacionamiento} onChange={(event) => handleModelInputChange(model.id, event)} type="number" />

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                      <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Checks rápidos
                        </p>
                        <h5 className="mt-1 text-sm font-semibold text-slate-900">
                          Características adicionales del modelo
                        </h5>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <Toggle name="sala" checked={model.sala} onChange={(event) => handleModelInputChange(model.id, event)} label="Sala" />
                        <Toggle name="comedor" checked={model.comedor} onChange={(event) => handleModelInputChange(model.id, event)} label="Comedor" />
                        <Toggle name="cocina" checked={model.cocina} onChange={(event) => handleModelInputChange(model.id, event)} label="Cocina" />
                        <Toggle name="area_servicio" checked={model.area_servicio} onChange={(event) => handleModelInputChange(model.id, event)} label="Area de servicio" />
                        <Toggle name="patio" checked={model.patio} onChange={(event) => handleModelInputChange(model.id, event)} label="Patio" />
                        <Toggle name="jardin" checked={model.jardin} onChange={(event) => handleModelInputChange(model.id, event)} label="Jardín" />
                        <Toggle name="alberca" checked={model.alberca} onChange={(event) => handleModelInputChange(model.id, event)} label="Alberca" />
                        <Toggle name="terraza" checked={model.terraza} onChange={(event) => handleModelInputChange(model.id, event)} label="Terraza" />
                        <Toggle name="amueblado" checked={model.amueblado} onChange={(event) => handleModelInputChange(model.id, event)} label="Amueblado" />
                        <Toggle name="bodega" checked={model.bodega} onChange={(event) => handleModelInputChange(model.id, event)} label="Bodega" />
                        <Toggle name="aire_acondicionado" checked={model.aire_acondicionado} onChange={(event) => handleModelInputChange(model.id, event)} label="Aire acondicionado" />
                        <Toggle name="boiler" checked={model.boiler} onChange={(event) => handleModelInputChange(model.id, event)} label="Boiler" />
                      </div>
                    </div>

                    <FieldTextarea
                      label="Comentarios del modelo"
                      name="comentarios"
                      value={model.comentarios}
                      onChange={(event) => handleModelInputChange(model.id, event)}
                      className="md:col-span-2"
                    />

                    {errors[`modelo_${model.id}_precios`] ? (
                      <p className="text-sm font-medium text-red-600 md:col-span-2">
                        {errors[`modelo_${model.id}_precios`]}
                      </p>
                    ) : null}
                    {errors[`modelo_${model.id}_bloqueado`] ? (
                      <p className="text-sm font-medium text-amber-700 md:col-span-2">
                        {errors[`modelo_${model.id}_bloqueado`]}
                      </p>
                    ) : null}

                    <ImageGridUploader
                      images={model.imagenes}
                      onAddImages={(event) => handleAddModelImages(model.id, event)}
                      onRemoveImage={(imageIndex) => handleRemoveModelImage(model.id, imageIndex)}
                      onUpdateImageTitle={(imageIndex, titulo) =>
                        handleModelImageTitleChange(model.id, imageIndex, titulo)
                      }
                      onSetPrimaryImage={(type, imageIndex) => {
                        if (type === "new") {
                          handleSetPrimaryModelImage(model.id, imageIndex);
                        }
                      }}
                      error={errors[`modelo_${model.id}_imagenes`]}
                      label={`Imágenes del modelo ${index + 1}`}
                    />
                  </div>
                </section>
              );
            })}
          </div>
        </SectionCard>

        {submitError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {submitError}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-[#FD3939] px-6 py-2 text-base font-semibold text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[#0F172A] px-6 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Guardando..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
