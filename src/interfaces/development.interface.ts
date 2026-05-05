export interface DevelopmentRecord {
  id: number;
  slug: string;
  carpeta_id: string;
  titulo: string;
  tipo_inmueble: string;
  esquema_comercial: CommercialScheme[];
  descripcion?: string;
  tipos_pago: string[];
  estatus: string;
  etiquetas: string[];
  exclusiva: boolean;
  tiene_gravamen: boolean;
  entrega_inmediata?: boolean;
  fecha_entrega?: string;
  cuota_mantenimiento?: number;
  comentarios?: string;
  pisos_tiene?: number;
  servicios_instalaciones?: string;
  enlace_direccion?: string;
  amenidades?: string;
  medidas: DevelopmentMeasures;
  direccion: DevelopmentAddress;
  caracteristicas?: DevelopmentFeatures;
  imagenes: DevelopmentImage[];
  modelos: DevelopmentModelRecord[];
  creado_en: string;
  creado_por_id: number;
  creador: DevelopmentCreator;
}

export interface DevelopmentModelRecord {
  id?: number;
  nombre: string;
  descripcion?: string;
  esquema_comercial: CommercialScheme[];
  tipos_pago: string[];
  medidas: DevelopmentMeasures;
  caracteristicas?: DevelopmentFeatures;
  comentarios?: string;
  imagenes: DevelopmentImage[];
  creado_en?: string;
  actualizado_en?: string;
}

export interface CreateDevelopmentModelPayload {
  id?: number;
  nombre: string;
  descripcion?: string;
  esquema_comercial: CommercialScheme[];
  tipos_pago?: string[];
  medidas: DevelopmentMeasures;
  caracteristicas?: DevelopmentFeatures;
  comentarios?: string;
  imagenes?: DevelopmentImage[];
  imagenes_nuevas_metadata?: DevelopmentImageMetadata[];
}

export interface CommercialScheme {
  tipo_operacion: string;
  precio: number;
  descuento_cantidad?: number;
}

export interface DevelopmentCreator {
  id?: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo_electronico: string;
  foto_url: string;
}

export interface DevelopmentMeasures {
  terreno_m2?: number;
  construccion_m2?: number;
  frente?: number;
  fondo?: number;
}

export interface DevelopmentAddress {
  cp?: number;
  fraccionamiento: string;
  zona?: string;
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

export interface DevelopmentFeatures {
  banos?: number;
  recamaras?: number;
  estacionamiento?: number;
  cuota_mantenimiento_tipo?: "Fijo" | "Por metro cuadrado";
  tipo_modelo?: "Casa" | "Departamento";
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

export interface DevelopmentImage {
  url: string;
  titulo: string;
  principal: boolean;
}

export interface DevelopmentImageMetadata {
  titulo: string;
  principal: boolean;
}

export interface NewDevelopmentImage extends DevelopmentImageMetadata {
  file: File;
}

export type CreateDevelopmentPayload = Omit<
  DevelopmentRecord,
  | "id"
  | "carpeta_id"
  | "creado_por_id"
  | "slug"
  | "creado_en"
  | "imagenes"
  | "modelos"
  | "creador"
  | "enlace_direccion"
> & {
  enlace_direccion?: string;
  imagenes?: DevelopmentImage[];
  imagenes_nuevas_metadata?: DevelopmentImageMetadata[];
  modelos?: CreateDevelopmentModelPayload[];
};

export type UpdateDevelopmentPayload = Partial<CreateDevelopmentPayload> & {
  carpeta_id?: string;
};

export interface DevelopmentFilters {
  tipo_operacion?: string;
  tipo_inmueble?: string;
  estatus?: string;
  minPrecio?: number;
  maxPrecio?: number;
}
