import { apiRequest } from "@/shared/apiRequest";

export interface DocumentoEmpleado {
  id: number;
  empleado_id: number;
  incapacidad_id: number | null;
  tipo: string;
  descripcion: string | null;
  archivo_url: string;
  nombre_archivo: string;
  creado_en: string;
  actualizado_en: string;
}

export const TIPOS_DOCUMENTO = [
  "Acta de nacimiento",
  "INE",
  "CURP",
  "N.S.S",
  "Comprobante de estudios",
  "Comprobante de domicilio",
  "R.F.C",
  "Carta de recomendación 1",
  "Carta de recomendación 2",
  "Cuenta bancaria",
  "CV del empleado",
  "Exámenes médicos",
  "Antecedentes no penales",
  "Pruebas psicométricas",
] as const;

export const TIPOS_DOCUMENTO_EXCLUIDOS_BECARIO: readonly string[] = [
  "Acta de nacimiento",
  "Carta de recomendación 1",
  "Carta de recomendación 2",
  "Antecedentes no penales",
];

export const getDocumentosByEmpleado = (empleadoId: number) =>
  apiRequest<DocumentoEmpleado[]>(`/documentos-empleado/empleado/${empleadoId}`);

export const getDocumentosByIncapacidad = (incapacidadId: number) =>
  apiRequest<DocumentoEmpleado[]>(`/documentos-empleado/incapacidad/${incapacidadId}`);

export const uploadDocumento = (
  empleadoId: number,
  tipo: string,
  file: File,
  opts: { descripcion?: string; incapacidad_id?: number } = {},
) => {
  const form = new FormData();
  form.append("empleado_id", String(empleadoId));
  form.append("tipo", tipo);
  form.append("file", file);
  if (opts.descripcion) form.append("descripcion", opts.descripcion);
  if (opts.incapacidad_id != null) form.append("incapacidad_id", String(opts.incapacidad_id));
  return apiRequest<DocumentoEmpleado>("/documentos-empleado/upload", {
    method: "POST",
    data: form,
  });
};

export const deleteDocumento = (id: number) =>
  apiRequest<void>(`/documentos-empleado/${id}`, { method: "DELETE" });
