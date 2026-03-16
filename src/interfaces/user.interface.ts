export interface RoleOptionRecord {
  id: number;
  rol: string;
}

export type UserRoleRecord =
  | string
  | {
      rol?:
        | string
        | {
            id?: number;
            rol?: string | null;
            nombre?: string | null;
          }
        | null;
      nombre?: string | null;
    };

export interface UserRecord {
  id: number;
  nombres?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  telefono?: string | number | null;
  correo_electronico?: string | null;
  foto_url?: string | null;
  folio_certificacion?: string | null;
  activo?: boolean | null;
  rol?: UserRoleRecord | string | null;
  roles?: UserRoleRecord[] | string[] | null;
}

export interface CreateUserPayload {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  telefono: string;
  correo_electronico: string;
  contrasena: string;
  foto_url?: string;
  folio_certificacion?: string;
  creado_por_id?: number;
  roles_ids: number[];
}

export type UpdateUserPayload = Partial<CreateUserPayload>;

export interface ToggleUserStatusResponse {
  message: string;
  activo: boolean;
}
