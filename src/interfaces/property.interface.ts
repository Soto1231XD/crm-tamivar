export interface PropertyRecord {
  id: number;
  slug: string;
  titulo: string;
  tipo_inmueble: string;
  tipo_operacion: string;
  descripcion?: string;
  precio: number;
  precio_condicionado?: PrecioCondicionado;
  tipos_pago: string[];
  estatus: string;
  etiquetas: string[]; 
  tiene_gravamen: boolean;
  cuota_mantenimiento?: number;
  comentarios?: string;
  pisos_tiene?: number;
  servicios_instalaciones?: string;
  amenidades?: string;
  medidas: Medidas;
  direccion: Direccion;
  caracteristicas: Caracteristicas;
  imagenes: Imagen[];
  creado_en: string;
  creado_por_id: number;
  creador: Creador;
}

export interface Creador {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo_electronico: string;
  foto_url: string;
}

// Sub-interfaces
export interface PrecioCondicionado {
  descripcion?: string;
  monto: number;
}

export interface Medidas {
  terreno_m2: number;
  construccion_m2: number;
  frente: number;
  fondo: number;
}

export interface Direccion {
  cp: number;
  fraccionamiento: string;
  smz?: number;
  mza?: number;
  lote?: number;
  calle: string;
  num_ext: number;
  num_int?: number;
  municipio: string;
  estado: string;
  referencias?: string;
}

export interface Caracteristicas {
  banos: number;
  recamaras: number;
  estacionamiento: number;
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
}

export interface Imagen {
  url: string;
  titulo: string;
  principal: boolean;
}

// Payloads para peticiones
export type CreatePropertyPayload = Omit<PropertyRecord, 'id' | 'slug' | 'creado_en' | 'imagenes' | "creador"> & {
  imagenes?: Imagen[]; 
};
export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;
