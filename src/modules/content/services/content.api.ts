import { apiRequest } from '../../../shared/apiRequest';
import type { BlogRecord, CreateBlogPayload, UpdateBlogPayload } from '@/interfaces/blog.interface';

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
