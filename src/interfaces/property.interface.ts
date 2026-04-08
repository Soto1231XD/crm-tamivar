export interface PropertyRecord {
  id: number;
  slug: string;
  carpeta_id: string;
  titulo: string;
  tipo_inmueble: string;
  esquema_comercial: EsquemaComercial[];
  descripcion?: string;
  tipos_pago: string[]; 
  estatus: string;
  etiquetas: string[];
  exclusiva: boolean;
  tiene_gravamen: boolean;
  cuota_mantenimiento?: number;
  comentarios?: string;
  pisos_tiene?: number;
  servicios_instalaciones?: string;
  amenidades?: string;
  medidas: Medidas;
  direccion: Direccion;
  caracteristicas?: Caracteristicas;
  imagenes: Imagen[];
  creado_en: string;
  creado_por_id: number;
  creador: Creador;
}

export interface EsquemaComercial {
  tipo_operacion: string;
  precio: number;
  descuento_cantidad?: number;
}

export interface Creador {
  id?: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo_electronico: string;
  foto_url: string;
}

export interface Medidas {
  terreno_m2?: number;
  construccion_m2?: number;
  frente?: number;
  fondo?: number;
}

export interface Direccion {
  cp?: number;
  fraccionamiento: string;
  smz?: number;
  mza?: number;
  lote?: number;
  calle?: string;
  num_ext?: number;
  num_int?: number;
  municipio: string;
  estado: string;
  referencias?: string;
}

export interface Caracteristicas {
  banos?: number;
  recamaras?: number;
  estacionamiento?: number;
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
}

export interface Imagen {
  url: string;
  titulo: string;
  principal: boolean;
}

export interface ImagenMetadata {
  titulo: string;
  principal: boolean;
}

export interface NuevaImagen extends ImagenMetadata {
  file: File;
}

// Payloads para peticiones
export type CreatePropertyPayload = 
  Omit<PropertyRecord, 'id' | 'carpeta_id' | 'creado_por_id' | 'slug' | 'creado_en' | 'imagenes' | 'creador'> & {
  imagenes?: Imagen[];
  imagenes_nuevas_metadata?: ImagenMetadata[];
};

export type UpdatePropertyPayload = Partial<CreatePropertyPayload> & {
  carpeta_id?: string;
};
