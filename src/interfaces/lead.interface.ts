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
  registro_lead_id?: number | null;
  folio?: string | null;
  nombres: string;
  apellidos: string;
  lada?: string | null;
  telefono: string | number;
  correo_electronico?: string | null;
  comentarios?: string | null;
  estado?: string | null;
  prioridad?: string | null;
  fecha_cita?: string | null;
  asesor_externo?: boolean | null;
  asesor_externo_nombre?: string | null;
  creado_en?: string;
  asignado_en?: string | null;
  ultimo_seguimiento_en?: string | null;
  vigencia_hasta?: string | null;
  vigencia_activa?: boolean | null;
  dias_vigencia_restantes?: number | null;
  creado_por_id?: number | null;
  propiedad_id?: number | null;
  vendedor_asignado_id?: number | null;
  operacion?: string | null;
  canal?: string | null;
  solicitud?: string | null;
  presupuesto?: string | number | null;
  ubicacion_propiedad?: string | null;
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
  prioridad?: string;
  fecha_cita?: string;
  asesor_externo?: boolean;
  asesor_externo_nombre?: string;
  vendedor_asignado_id?: number;
  operacion?: string;
  canal?: string;
  solicitud?: string;
  presupuesto?: number;
  ubicacion_propiedad?: string;
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
  asesor_externo?: boolean;
  asesor_externo_nombre?: string;
  vendedor_asignado_id?: number;
  operacion?: string;
  canal?: string;
  solicitud?: string;
  presupuesto?: number;
  ubicacion_propiedad?: string;
  metodo_pago?: string;
  caracteristicas?: string;
  origen_lead?: string;
}
