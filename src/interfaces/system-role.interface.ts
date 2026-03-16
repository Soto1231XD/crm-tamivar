export interface PermissionRecord {
  id: number;
  modulo: string;
  accion: string;
}

export interface RolePermissionRecord {
  permiso: PermissionRecord;
}

export interface SystemRoleRecord {
  id: number;
  rol: string;
  permisos?: RolePermissionRecord[];
}

export interface CreateSystemRolePayload {
  rol: string;
  permisosIds: number[];
}
