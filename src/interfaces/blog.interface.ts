export interface BlogImageRecord {
  url: string;
  titulo: string;
  principal: boolean;
}

export interface BlogAuthorRecord {
  id: number;
  nombres?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  correo_electronico?: string | null;
  foto_url?: string | null;
}

export interface BlogRecord {
  id: number;
  titulo: string;
  subtitulo: string;
  slug: string;
  resumen?: string | null;
  contenido: string;
  etiquetas?: string[] | null;
  imagenes?: BlogImageRecord[] | null;
  publicado?: boolean | null;
  fechaPublico?: string | null;
  creadoEn: string;
  actualizadoEn: string;
  autor?: BlogAuthorRecord | null;
  autor_id?: number | null;
}

export interface CreateBlogPayload {
  titulo: string;
  subtitulo: string;
  resumen?: string;
  contenido: string;
  etiquetas?: string[];
  publicado?: boolean;
  fechaPublico?: string;
  autor_id: number;
}

export type UpdateBlogPayload = Partial<CreateBlogPayload> & {
  imagenes?: BlogImageRecord[];
};
