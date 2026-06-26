export type ModuleKey =
  | 'dashboard'
  | 'Estadísticas'
  | 'propiedades'
  | 'desarrollos'
  | 'material'
  | 'registros'
  | 'registros_leads'
  | 'solicitudes_leads'
  | 'blogs'
  | 'usuarios'
  | 'roles'
  | 'movimientos'
  | 'Operaciones'
  | 'Comisiones'
  | 'CarteraClientes';

export type ModulePermissions = {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
};
