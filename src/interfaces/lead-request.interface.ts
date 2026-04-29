export interface LeadRequestSellerRecord {
  id: number;
  nombres?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  correo_electronico?: string | null;
  foto_url?: string | null;
}

export interface LeadRequestRecord {
  id: number;
  estado?: string | null;
  fecha_alta?: string | null;
  vendedor_id?: number | null;
  nombre: string;
  telefono: string | number;
  solicitud?: string | null;
  tipo_inmueble?: string | null;
  presupuesto?: string | number | null;
  metodo_pago?: string | null;
  ubicacion?: string | null;
  numero_habitaciones?: string | null;
  caracteristicas?: string | null;
  seguimiento?: string | null;
  opciones_enviadas?: string | null;
  medio?: string | null;
  comentario_final?: string | null;
  creado_por_id?: number | null;
  creado_en?: string | null;
  actualizado_en?: string | null;
  vendedor?: LeadRequestSellerRecord | null;
}

export interface CreateLeadRequestPayload {
  estado?: string;
  fecha_alta: string;
  vendedor_id: number;
  nombre: string;
  telefono?: string;
  solicitud: string;
  tipo_inmueble?: string;
  presupuesto?: number;
  metodo_pago?: string;
  ubicacion?: string;
  numero_habitaciones?: string;
  caracteristicas?: string;
  seguimiento?: string;
  opciones_enviadas?: string;
  medio?: string;
  comentario_final?: string;
  creado_por_id: number;
}

export type UpdateLeadRequestPayload = Partial<Omit<CreateLeadRequestPayload, 'creado_por_id'>>;
