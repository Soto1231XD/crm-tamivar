export type FormState = {
  titulo: string;
  tipo_inmueble: string;
  tipo_operacion: string;
  descripcion: string;
  precio: string;
  precio_condicionado_descripcion: string;
  precio_condicionado_monto: string;
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
  cuota_mantenimiento: string;
  comentarios: string;
  pisos_tiene: string;
  servicios_instalaciones: string;
  amenidades: string;
  imagenes: File[]; // El array de archivos
  imagenes_existentes: any[];
};

// Interfaz para los números ya convertidos (parsed)
export interface ParsedNumbers {
  precio: number;
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
  precio_condicionado: number;
}

/**
 * Valida los datos del formulario de propiedades.
 * Devuelve un objeto con los errores de cada campo, o un objeto vacío si todo está correcto.
 */
export type FormErrors = Partial<Record<keyof FormState, string>>;

export function validatePropertyForm(
  form: FormState,
  parsed: ParsedNumbers,
): FormErrors {
  const errors: FormErrors = {};

  // Validación de Precio
  if (Number.isNaN(parsed.precio) || parsed.precio <= 0) {
    errors.precio = "Debe ser un valor numérico mayor a 0.";
  }

  // Validación de Código Postal
  const cpString = String(parsed.cp);
  if (cpString.length !== 5 || Number.isNaN(parsed.cp)) {
    errors.cp = "El código postal debe tener exactamente 5 dígitos.";
  }

  // Validación de Tipos de pago
  if (form.tipos_pago.length === 0) {
    errors.tipos_pago = "Debes seleccionar al menos un método de pago.";
  }

  // Validaciones de números opcionales
  if (form.smz && Number.isNaN(parsed.smz))
    errors.smz = "Debe ser un número válido.";
  if (form.mza && Number.isNaN(parsed.mza))
    errors.mza = "Debe ser un número válido.";
  if (form.lote && Number.isNaN(parsed.lote))
    errors.lote = "Debe ser un número válido.";
  if (form.num_int && Number.isNaN(parsed.num_int))
    errors.num_int = "Debe ser un número válido.";

  return errors;
}