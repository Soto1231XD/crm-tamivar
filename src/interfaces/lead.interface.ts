export interface LeadCreatorRecord {
  id: number;
  nombres?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  correo_electronico?: string | null;
  foto_url?: string | null;
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
  propiedad_id?: number | null;
  vendedor_asignado_id?: number | null;
  operacion?: string | null;
  canal?: string | null;
  solicitud?: string | null;
  presupuesto?: string | number | null;
  metodo_pago?: string | null;
  caracteristicas?: string | null;
  origen_lead?: string | null;
  creador?: LeadCreatorRecord | null;
  vendedor_asignado?: LeadCreatorRecord | null;
  propiedad?: LeadPropertyRecord | null;
}

export interface CreateLeadPayload {
  nombres: string;
  apellidos: string;
  telefono: string;
  propiedad_id?: number;
  creado_por_id: number;
  lada?: string;
  correo_electronico?: string;
  comentarios?: string;
  estado?: string;
  prioridad: string;
  fecha_cita?: string;
  vendedor_asignado_id?: number;
  operacion?: string;
  canal?: string;
  solicitud?: string;
  presupuesto?: number;
  metodo_pago?: string;
  caracteristicas?: string;
  origen_lead?: string;
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
  vendedor_asignado_id?: number;
  operacion?: string;
  canal?: string;
  solicitud?: string;
  presupuesto?: number;
  metodo_pago?: string;
  caracteristicas?: string;
  origen_lead?: string;
}
