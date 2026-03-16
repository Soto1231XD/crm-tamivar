export type AppRole =
  | 'Super Administrador'
  | 'Administrador'
  | 'Marketing'
  | 'Recursos Humanos'
  | 'Coordinador de Ventas'
  | 'Asesor de Ventas';

type DashboardCardTitle =
  | 'Propiedades Disponibles'
  | 'Registros'
  | 'Propiedades vendidas'
  | 'Blogs'
  | 'Usuarios del sistema'
  | 'Roles del sistema';

type DashboardSectionTitle =
  | 'Registros Recientes'
  | 'Propiedades Recientes'
  | 'Usuarios'
  | 'Publicaciones';

export const DASHBOARD_ENABLED_ROLES: AppRole[] = [
  'Super Administrador',
  'Administrador',
  'Marketing',
  'Recursos Humanos',
  'Coordinador de Ventas',
  'Asesor de Ventas',
];

export const DASHBOARD_CARD_TITLES: Partial<Record<AppRole, readonly DashboardCardTitle[]>> = {
  'Super Administrador': [
    'Propiedades Disponibles',
    'Registros',
    'Propiedades vendidas',
    'Blogs',
    'Usuarios del sistema',
    'Roles del sistema',
  ],
  'Administrador': [
    'Propiedades Disponibles',
    'Registros',
    'Propiedades vendidas',
    'Blogs',
    'Usuarios del sistema',
  ],
  'Marketing': [
    'Propiedades Disponibles', 
    'Blogs', 
    'Propiedades vendidas'
  ],
  'Recursos Humanos': [
    'Propiedades Disponibles', 
    'Usuarios del sistema', 
    'Roles del sistema'
  ],
  'Coordinador de Ventas': [
    'Propiedades Disponibles', 
    'Registros', 
    'Propiedades vendidas'
  ],
  'Asesor de Ventas': [
    'Propiedades Disponibles', 
    'Registros', 
    'Propiedades vendidas'
  ],
};

export const DASHBOARD_SECTION_TITLES: Partial<Record<AppRole, readonly DashboardSectionTitle[]>> = {
  'Super Administrador': ['Registros Recientes', 'Propiedades Recientes', 'Usuarios', 'Publicaciones'],
  'Administrador': ['Registros Recientes', 'Propiedades Recientes', 'Usuarios', 'Publicaciones'],
  'Marketing': ['Publicaciones', 'Propiedades Recientes'],
  'Recursos Humanos': ['Propiedades Recientes', 'Usuarios'],
  'Coordinador de Ventas': ['Registros Recientes', 'Propiedades Recientes'],
  'Asesor de Ventas': ['Registros Recientes', 'Propiedades Recientes'],
};