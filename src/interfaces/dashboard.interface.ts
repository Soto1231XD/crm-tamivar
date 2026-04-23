export interface DashboardRecentLeadRecord {
  nombre: string;
  apellido: string;
  correo: string;
  estado: string;
}

export interface DashboardRecentPropertyRecord {
  tipo_inmueble: string;
  direccion: {
    calle: string;
    municipio: string;
    fraccionamiento: string;
  };
  estatus: string;
  precio: string;
  imagenes?: DashboardPublicationImageRecord[] | null;
}

export interface DashboardRecentUserRecord {
  nombres: string;
  apellido_paterno: string;
  correo_electronico: string;
  rol?: string;
  roles?: string[];
}

export interface DashboardPublicationImageRecord {
  url?: string;
  titulo?: string;
  principal?: boolean;
}

export interface DashboardRecentPublicationRecord {
  titulo: string;
  fecha_creacion: string;
  fechaPublico?: string | null;
  publicado: boolean;
  imagenes?: DashboardPublicationImageRecord[] | null;
}

export interface DashboardSummary {
  propiedades_disponibles: number;
  registros: number;
  usuarios_sistema: number;
  registros_recientes: DashboardRecentLeadRecord[];
  propiedades_recientes: DashboardRecentPropertyRecord[];
  usuarios_recientes: DashboardRecentUserRecord[];
  mis_publicaciones: DashboardRecentPublicationRecord[];
}

export type RecentProperty = DashboardRecentPropertyRecord;
