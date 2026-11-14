export type ModuleKey =
  | 'dashboard'
  | 'Estadísticas'
  | 'propiedades'
  | 'desarrollos'
  | 'material'
  | 'registros'
  | 'registros_leads'
  | 'asesor_externo'
  | 'blogs'
  | 'usuarios'
  | 'roles'
  | 'movimientos'
  | 'Operaciones'
  | 'Comisiones'
  | 'CarteraClientes'
  | 'evaluacion'
  | 'recomendaciones'
  | 'mapa'
  | 'rh_empleados'
  | 'rh_candidatos'
  | 'rh_becarios'
  | 'rh_eventos';

export type ModulePermissions = {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
};
