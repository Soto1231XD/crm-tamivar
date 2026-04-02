export type FormState = {
  titulo: string;
  tipo_inmueble: string;
  operaciones: string[];
  descripcion: string;
  precio_venta: string;
  descuento_venta: string;
  precio_renta: string;
  descuento_renta: string;
  precio_preventa: string;
  descuento_preventa: string;
  tipos_pago: string[];
  estatus: string;
  etiquetas: string;
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
  exclusiva: boolean;
  cuota_mantenimiento: string;
  comentarios: string;
  pisos_tiene: string;
  servicios_instalaciones: string;
  amenidades: string;
  imagenes: File[];
  imagenes_existentes: any[];
};

export interface ParsedNumbers {
  cp: number;
  num_ext: number;
  terreno: number;
  construccion: number;
  frente: number;
  fondo: number;
  recamaras: number;
  banos: number;
  estacionamiento: number;
  smz: number;
  mza: number;
  lote: number;
  num_int: number;
  precio_venta: number;
  descuento_venta: number;
  precio_renta: number;
  descuento_renta: number;
  precio_preventa: number;
  descuento_preventa: number;
}

export type FormErrors = Partial<Record<keyof FormState, string>>;

export function validatePropertyForm(
  form: FormState,
  parsed: ParsedNumbers,
): FormErrors {
  const errors: FormErrors = {};
  const isTerreno = form.tipo_inmueble.trim().toLowerCase() === "terreno";

  if (form.operaciones.length === 0) {
    errors.operaciones = "Debes seleccionar al menos una operación.";
  }

  // Validación de venta
  if (form.operaciones.includes("Venta")) {
    if (Number.isNaN(parsed.precio_venta) || parsed.precio_venta <= 0) {
      errors.precio_venta = "Ingresa un precio de venta valido mayor a 0.";
    }

    if (form.descuento_venta) {
      if (Number.isNaN(parsed.descuento_venta)) {
        errors.descuento_venta = "Ingresa un descuento de venta valido.";
      } else if (parsed.descuento_venta >= parsed.precio_venta) {
        errors.descuento_venta = "El descuento no puede ser mayor o igual al precio base.";
      }
    }
  }

  // Validación de renta
  if (form.operaciones.includes("Renta")) {
    if (Number.isNaN(parsed.precio_renta) || parsed.precio_renta <= 0) {
      errors.precio_renta = "Ingresa un precio de renta valido mayor a 0.";
    }

    if (form.descuento_renta) {
      if (Number.isNaN(parsed.descuento_renta)) {
        errors.descuento_renta = "Ingresa un descuento de renta valido.";
      } else if (parsed.descuento_renta >= parsed.precio_renta) {
        errors.descuento_renta = "El descuento no puede ser mayor o igual al precio base.";
      }
    }
  }

  // Validación de preventa
  if (form.operaciones.includes("Preventa")) {
    if (Number.isNaN(parsed.precio_preventa) || parsed.precio_preventa <= 0) {
      errors.precio_preventa =
        "Ingresa un precio de preventa valido mayor a 0.";
    }

    if (form.descuento_preventa) {
      if (Number.isNaN(parsed.descuento_preventa)) {
        errors.descuento_preventa = "Ingresa un descuento de preventa valido.";
      } else if (parsed.descuento_preventa >= parsed.precio_preventa) {
        errors.descuento_preventa = "El descuento no puede ser mayor o igual al precio base.";
      }
    }
  }

  const cpString = String(parsed.cp);
  if (cpString.length !== 5 || Number.isNaN(parsed.cp)) {
    errors.cp = "El código postal debe tener exactamente 5 dígitos.";
  }

  if (form.tipos_pago.length === 0) {
    errors.tipos_pago = "Debes seleccionar al menos un método de pago.";
  }

  if (form.smz && Number.isNaN(parsed.smz)) {
    errors.smz = "Debe ser un numero valido.";
  }
  if (form.mza && Number.isNaN(parsed.mza)) {
    errors.mza = "Debe ser un numero valido.";
  }
  if (form.lote && Number.isNaN(parsed.lote)) {
    errors.lote = "Debe ser un numero valido.";
  }
  if (form.num_int && Number.isNaN(parsed.num_int)) {
    errors.num_int = "Debe ser un numero valido.";
  }

  if (Number.isNaN(parsed.terreno) || parsed.terreno <= 0) {
    errors.terreno_m2 = "Ingresa una medida de terreno valida mayor a 0.";
  }
  if (Number.isNaN(parsed.frente) || parsed.frente <= 0) {
    errors.frente = "Ingresa un frente valido mayor a 0.";
  }
  if (Number.isNaN(parsed.fondo) || parsed.fondo <= 0) {
    errors.fondo = "Ingresa un fondo valido mayor a 0.";
  }

  if (!isTerreno) {
    if (Number.isNaN(parsed.construccion) || parsed.construccion <= 0) {
      errors.construccion_m2 =
        "Ingresa una medida de construcción valida mayor a 0.";
    }
    if (Number.isNaN(parsed.banos) || parsed.banos < 0) {
      errors.banos = "Ingresa un numero de baños valido.";
    }
    if (Number.isNaN(parsed.recamaras) || parsed.recamaras < 0) {
      errors.recamaras = "Ingresa un numero de recamaras valido.";
    }
    if (
      Number.isNaN(parsed.estacionamiento) ||
      parsed.estacionamiento < 0
    ) {
      errors.estacionamiento =
        "Ingresa un numero de estacionamientos valido.";
    }
  }

  return errors;
}