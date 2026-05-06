import { apiRequest } from "@/shared/apiRequest";
import type {
  CreateDevelopmentPayload,
  DevelopmentRecord,
  NewDevelopmentImage,
  UpdateDevelopmentPayload,
} from "@/interfaces/development.interface";

const PATH = "/developments";

export async function getDevelopments(): Promise<DevelopmentRecord[]> {
  const data = await apiRequest<DevelopmentRecord[]>(PATH);
  return Array.isArray(data) ? data : [];
}

export async function getDevelopment(id: number): Promise<DevelopmentRecord> {
  return apiRequest<DevelopmentRecord>(`${PATH}/${id}`);
}

export async function createDevelopment(
  payload: CreateDevelopmentPayload,
  files: NewDevelopmentImage[],
): Promise<DevelopmentRecord> {
  const formData = new FormData();

  files.forEach((image) => formData.append("files", image.file));
  formData.append("datos", JSON.stringify(payload));

  return apiRequest<DevelopmentRecord>(PATH, {
    method: "POST",
    data: formData,
  });
}

export async function updateDevelopment(
  id: number,
  payload: UpdateDevelopmentPayload,
  files: NewDevelopmentImage[],
): Promise<DevelopmentRecord> {
  const formData = new FormData();

  files.forEach((image) => formData.append("files", image.file));
  formData.append("datos", JSON.stringify(payload));

  return apiRequest<DevelopmentRecord>(`${PATH}/${id}`, {
    method: "PATCH",
    data: formData,
  });
}

export async function deleteDevelopment(id: number): Promise<void> {
  return apiRequest<void>(`${PATH}/${id}`, {
    method: "DELETE",
  });
}
