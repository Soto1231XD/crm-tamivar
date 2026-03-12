import { apiRequest } from '../../../shared/apiRequest';

export type BlogImageRecord = {
  url: string;
  titulo: string;
  principal: boolean;
};

export type BlogAuthorRecord = {
  id: number;
  nombres?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  correo_electronico?: string | null;
  foto_url?: string | null;
};

export type BlogRecord = {
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
};

export type CreateBlogPayload = {
  titulo: string;
  subtitulo: string;
  resumen?: string;
  contenido: string;
  etiquetas?: string[];
  publicado?: boolean;
  fechaPublico?: string;
  autor_id: number;
};

export type UpdateBlogPayload = Partial<CreateBlogPayload> & {
  imagenes?: BlogImageRecord[];
};

const PATH = '/blogs';

export async function getBlogs(): Promise<BlogRecord[]> {
  const data = await apiRequest<BlogRecord[]>(PATH);
  return Array.isArray(data) ? data : [];
}

export async function getBlog(id: number): Promise<BlogRecord> {
  return apiRequest<BlogRecord>(`${PATH}/${id}`);
}

export async function createBlog(payload: CreateBlogPayload, files: File[] = []): Promise<BlogRecord> {
  const formData = new FormData();

  files.forEach((file) => formData.append('files', file));
  formData.append('datos', JSON.stringify(payload));

  return apiRequest<BlogRecord>(PATH, {
    method: 'POST',
    data: formData,
  });
}

export async function updateBlog(
  id: number,
  payload: UpdateBlogPayload,
  files: File[] = [],
): Promise<BlogRecord> {
  const formData = new FormData();

  files.forEach((file) => formData.append('files', file));
  formData.append('datos', JSON.stringify(payload));

  return apiRequest<BlogRecord>(`${PATH}/${id}`, {
    method: 'PATCH',
    data: formData,
  });
}

export async function deleteBlog(id: number): Promise<void> {
  return apiRequest<void>(`${PATH}/${id}`, {
    method: 'DELETE',
  });
}
