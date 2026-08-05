import { apiRequest } from "../../../shared/apiRequest";
import type {
  BlogRecord,
  CreateBlogPayload,
  UpdateBlogPayload,
} from "@/interfaces/blog.interface";

const PATH = "/blogs";

export async function getBlogs(): Promise<BlogRecord[]> {
  const data = await apiRequest<BlogRecord[]>(PATH);
  return Array.isArray(data) ? data : [];
}

export async function getBlog(id: number): Promise<BlogRecord> {
  return apiRequest<BlogRecord>(`${PATH}/${id}`);
}

export async function createBlog(
  payload: CreateBlogPayload,
  files: File[] = [],
  archivo?: File | null,
): Promise<BlogRecord> {
  const formData = new FormData();

  files.forEach((file) => formData.append("files", file));
  if (archivo) formData.append("archivo", archivo);
  formData.append("datos", JSON.stringify(payload));

  return apiRequest<BlogRecord>(PATH, {
    method: "POST",
    data: formData,
  });
}

export async function updateBlog(
  id: number,
  payload: UpdateBlogPayload,
  files: File[] = [],
  archivo?: File | null,
): Promise<BlogRecord> {
  const formData = new FormData();

  if (payload.carpeta_id) {
    formData.append("carpeta_id", payload.carpeta_id);
  }

  formData.append("datos", JSON.stringify(payload));

  if (files && files.length > 0) {
    files.forEach((file) => formData.append("files", file));
  }
  if (archivo) formData.append("archivo", archivo);

  return apiRequest<BlogRecord>(`${PATH}/${id}`, {
    method: "PATCH",
    data: formData,
  });
}

export async function deleteBlog(id: number): Promise<void> {
  return apiRequest<void>(`${PATH}/${id}`, {
    method: "DELETE",
  });
}