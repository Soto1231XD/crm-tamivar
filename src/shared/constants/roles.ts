import type { ModuleKey, Role } from '../types/rbac';

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  properties: 'Propiedades',
  leads: 'Registros',
  users: 'Usuarios',
  hr: 'Recursos Humanos',
};

export const ROLE_MODULE_ACCESS: Record<Role, ModuleKey[]> = {
  SUPER_ADMIN: ['dashboard', 'properties', 'leads', 'users', 'hr'],
  ADMIN: ['dashboard', 'properties', 'leads', 'users'],
  MARKETING: ['dashboard', 'leads'],
  RH: ['dashboard', 'hr', 'properties', 'leads'],
  ASESOR_VENTAS: ['dashboard', 'properties', 'leads'],
  COORDINADOR_VENTAS: ['dashboard', 'properties', 'leads', 'users'],
};

export function canAccessModule(userRoles: Role[], module: ModuleKey): boolean {
  return userRoles.some((role) => ROLE_MODULE_ACCESS[role].includes(module));
}
