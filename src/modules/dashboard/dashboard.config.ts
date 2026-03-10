import type { Role } from '../../shared/types/rbac';

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
  | 'Mis publicaciones';

export const DASHBOARD_ENABLED_ROLES: Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'MARKETING',
  'RH',
  'COORDINADOR_VENTAS',
  'ASESOR_VENTAS',
];

export const DASHBOARD_CARD_TITLES: Partial<Record<Role, readonly DashboardCardTitle[]>> = {
  SUPER_ADMIN: [
    'Propiedades Disponibles',
    'Registros',
    'Propiedades vendidas',
    'Blogs',
    'Usuarios del sistema',
  ],
  ADMIN: ['Propiedades Disponibles', 'Registros', 'Propiedades vendidas', 'Blogs', 'Usuarios del sistema'],
  MARKETING: ['Propiedades Disponibles', 'Blogs', 'Propiedades vendidas'],
  RH: ['Propiedades Disponibles', 'Usuarios del sistema', 'Roles del sistema'],
  COORDINADOR_VENTAS: ['Propiedades Disponibles', 'Registros', 'Propiedades vendidas'],
  ASESOR_VENTAS: ['Propiedades Disponibles', 'Registros', 'Propiedades vendidas'],
};

export const DASHBOARD_SECTION_TITLES: Partial<Record<Role, readonly DashboardSectionTitle[]>> = {
  SUPER_ADMIN: ['Registros Recientes', 'Propiedades Recientes', 'Usuarios', 'Mis publicaciones'],
  ADMIN: ['Registros Recientes', 'Propiedades Recientes', 'Usuarios', 'Mis publicaciones'],
  MARKETING: ['Mis publicaciones', 'Propiedades Recientes'],
  RH: ['Propiedades Recientes', 'Usuarios'],
  COORDINADOR_VENTAS: ['Registros Recientes', 'Propiedades Recientes'],
  ASESOR_VENTAS: ['Registros Recientes', 'Propiedades Recientes'],
};
