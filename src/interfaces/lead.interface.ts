export interface LeadCreatorRecord {
  id: number;
  nombres?: string | null;
  apellido_paterno?: string | null;
}

export interface LeadPropertyRecord {
  direccion?: {
    calle?: string;
    municipio?: string;
    fraccionamiento?: string;
  };
}

export interface LeadRecord {
  id: number;
  nombres: string;
  apellidos: string;
  lada?: string | null;
  telefono: string | number;
  correo_electronico?: string | null;
  comentarios?: string | null;
  estado?: string | null;
  prioridad?: string | null;
  fecha_cita?: string | null;
  creado_en?: string;
  propiedad_id: number;
  creador?: LeadCreatorRecord | null;
  propiedad?: LeadPropertyRecord | null;
}

export interface CreateLeadPayload {
  nombres: string;
  apellidos: string;
  telefono: string;
  propiedad_id: number;
  creado_por_id: number;
  lada?: string;
  correo_electronico?: string;
  comentarios?: string;
  estado?: string;
  prioridad: string;
  fecha_cita?: string;
}

export interface UpdateLeadPayload {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  propiedad_id?: number;
  lada?: string;
  correo_electronico?: string;
  comentarios?: string;
  estado?: string;
  prioridad?: string;
  fecha_cita?: string;
}
