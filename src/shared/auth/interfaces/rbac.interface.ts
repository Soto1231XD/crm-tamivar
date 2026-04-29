export type ModuleKey =
  | 'dashboard'
  | 'propiedades'
  | 'registros'
  | 'registros_leads'
  | 'solicitudes_leads'
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
