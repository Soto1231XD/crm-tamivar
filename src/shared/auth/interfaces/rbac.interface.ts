export type ModuleKey =
  | 'dashboard'
  | 'propiedades'
  | 'desarrollos'
  | 'material'
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
