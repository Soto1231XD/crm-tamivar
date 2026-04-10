export interface MovementUser {
  nombres: string;
  correo_electronico: string;
}

export interface MovementChangedField {
  campo: string;
  antes: unknown;
  despues: unknown;
}

export interface MovementRecord {
  id: number;
  metodo: string;
  ruta: string;
  modulo?: string | null;
  accion?: string | null;
  statusCode: number;
  ip?: string | null;
  usuario_id?: number | null;
  descripcion?: string | null;
  recurso_id?: string | null;
  detalle_antes?: Record<string, unknown> | null;
  detalle_despues?: Record<string, unknown> | null;
  campos_modificados?: MovementChangedField[] | null;
  creado_en: string;
  usuario?: MovementUser | null;
}

export interface MovementFilters {
  modulo?: string;
  metodo?: string;
  desde?: string;
  hasta?: string;
  usuario_id?: number;
}
