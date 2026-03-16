export type ModuleKey =
  | 'dashboard'
  | 'propiedades'
  | 'registros'
  | 'blogs'
  | 'usuarios'
  | 'roles'
  | 'movimientos';

export type ModulePermissions = {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
};