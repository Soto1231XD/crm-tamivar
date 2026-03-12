export const TYPE_OPTIONS = ['Casa', 'Departamento', 'Desarrollo', 'Terreno', 'Local comercial', 'Edificio comercial'] as const;
export const OPERATION_OPTIONS = ['Venta', 'Renta', 'Preventa'] as const;
export const STATUS_OPTIONS = ['Disponible', 'Apartado', 'Vendido', 'Preventa', 'Baja'] as const;
export const PAYMENT_OPTIONS = ['Efectivo', 'Infonavit', 'Cofinavit', 'Crédito bancario', 'Fovissste', 'Issfam', 'Otro'] as const;

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
 * Devuelve un string con el mensaje de error si algo falla, o null si todo está correcto.
 */
export function validatePropertyForm(
  form: FormState,
  parsed: ParsedNumbers,
): string | null {
  // Validaciones de campos obligatorios de texto
  if (!form.titulo.trim()) return "El título es obligatorio.";
  if (!form.tipo_inmueble.trim()) return "El tipo de inmueble es obligatorio.";
  if (!form.tipo_operacion.trim())
    return "El tipo de operación es obligatorio.";
  if (!form.estatus.trim()) return "El estatus es obligatorio.";

  // Validación de Precio
  if (Number.isNaN(parsed.precio) || parsed.precio <= 0) {
    return "El precio es obligatorio y debe ser mayor a 0.";
  }

  // Validación de números obligatorios
  if (
    Number.isNaN(parsed.cp) ||
    Number.isNaN(parsed.num_ext) ||
    Number.isNaN(parsed.terreno) ||
    Number.isNaN(parsed.construccion) ||
    Number.isNaN(parsed.frente) ||
    Number.isNaN(parsed.fondo) ||
    Number.isNaN(parsed.recamaras) ||
    Number.isNaN(parsed.banos) ||
    Number.isNaN(parsed.estacionamiento)
  ) {
    return "Completa correctamente los campos obligatorios numéricos.";
  }

  // Validaciones específicas de la dirección
  if (String(parsed.cp).length !== 5) {
    return "El código postal debe tener 5 dígitos.";
  }

  // Validación de números opcionales (solo si se ingresaron)
  if (
    (form.smz && Number.isNaN(parsed.smz)) ||
    (form.mza && Number.isNaN(parsed.mza)) ||
    (form.lote && Number.isNaN(parsed.lote)) ||
    (form.num_int && Number.isNaN(parsed.num_int))
  ) {
    return "Revisa los campos opcionales de dirección.";
  }

  // Validación de Tipos de pago y campos de texto de dirección
  if (form.tipos_pago.length === 0)
    return "Selecciona al menos un tipo de pago.";
  if (
    !form.calle.trim() ||
    !form.municipio.trim() ||
    !form.estado.trim() ||
    !form.fraccionamiento.trim()
  ) {
    return "La dirección es obligatoria.";
  }

  // Si todas las validaciones pasan, retornamos null indicando que no hay errores
  return null;
}
