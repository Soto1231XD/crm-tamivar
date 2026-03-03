export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MARKETING'
  | 'RH'
  | 'ASESOR_VENTAS'
  | 'COORDINADOR_VENTAS';

export type ModuleKey =
  | 'dashboard'
  | 'properties'
  | 'leads'
  | 'content'
  | 'users'
  | 'system_roles'
  | 'system_logs';

export type ModulePermissions = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

export type AppUser = {
  id: number;
  fullName: string;
  nombres?: string;
  apellidoPaterno?: string;
  email: string;
  roles: Role[];
};

export type LoginCredentials = {
  correo_electronico: string;
  contrasena: string;
};
