export interface MovementUser {
  nombres: string;
  correo_electronico: string;
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
