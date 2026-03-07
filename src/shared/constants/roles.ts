import type { AppUser, ModuleKey, ModulePermissions, Role } from '../types/rbac';

const NONE: ModulePermissions = { view: false, create: false, edit: false, delete: false };
const VIEW_ONLY: ModulePermissions = { view: true, create: false, edit: false, delete: false };
const MANAGE: ModulePermissions = { view: true, create: true, edit: true, delete: true };

const BASE_MODULES: Record<ModuleKey, ModulePermissions> = {
  dashboard: { ...NONE },
  properties: { ...NONE },
  leads: { ...NONE },
  content: { ...NONE },
  users: { ...NONE },
  system_roles: { ...NONE },
  system_logs: { ...NONE },
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MARKETING: 'Marketing',
  RH: 'Recursos Humanos',
  ASESOR_VENTAS: 'Asesor de Ventas',
  COORDINADOR_VENTAS: 'Coordinador de Ventas',
};

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  properties: 'Propiedades',
  leads: 'Registros',
  content: 'Contenido',
  users: 'Usuarios',
  system_roles: 'Roles del sistema',
  system_logs: 'Logs del sistema',
};

export const ROLE_MODULE_PERMISSIONS: Record<Role, Record<ModuleKey, ModulePermissions>> = {
  SUPER_ADMIN: {
    ...BASE_MODULES,
    dashboard: { ...MANAGE },
    properties: { ...MANAGE },
    leads: { ...MANAGE },
    content: { ...MANAGE },
    users: { ...MANAGE },
    system_roles: { ...MANAGE },
    system_logs: { ...MANAGE },
  },
  ADMIN: {
    ...BASE_MODULES,
    dashboard: { ...VIEW_ONLY },
    properties: { ...MANAGE },
    leads: { ...MANAGE },
    content: { ...MANAGE },
    users: { ...MANAGE },
    system_roles: { ...NONE },
    system_logs: { ...NONE },
  },
  MARKETING: {
    ...BASE_MODULES,
    dashboard: { ...VIEW_ONLY },
    properties: { ...VIEW_ONLY },
    content: { view: true, create: true, edit: true, delete: false },
  },
  RH: {
    ...BASE_MODULES,
    dashboard: { ...VIEW_ONLY },
    users: { ...VIEW_ONLY },
  },
  ASESOR_VENTAS: {
    ...BASE_MODULES,
    dashboard: { ...VIEW_ONLY },
    properties: { view: true, create: true, edit: true, delete: false },
    leads: { view: true, create: true, edit: true, delete: false },
  },
  COORDINADOR_VENTAS: {
    ...BASE_MODULES,
    dashboard: { ...VIEW_ONLY },
    properties: { view: true, create: true, edit: true, delete: false },
    leads: { view: true, create: true, edit: true, delete: false },
  },
};

export function hasAnyRole(userRoles: Role[], allowedRoles: Role[]): boolean {
  return userRoles.some((role) => allowedRoles.includes(role));
}

export function getModulePermissions(userRoles: Role[], module: ModuleKey): ModulePermissions {
  const permissions = { ...NONE };

  for (const role of userRoles) {
    const rolePermissions = ROLE_MODULE_PERMISSIONS[role]?.[module];
    if (!rolePermissions) continue;

    permissions.view = permissions.view || rolePermissions.view;
    permissions.create = permissions.create || rolePermissions.create;
    permissions.edit = permissions.edit || rolePermissions.edit;
    permissions.delete = permissions.delete || rolePermissions.delete;
  }

  return permissions;
}

export function canAccessModule(userRoles: Role[], module: ModuleKey): boolean {
  return getModulePermissions(userRoles, module).view;
}

export function getAvailableModules(userRoles: Role[]): ModuleKey[] {
  const modules: ModuleKey[] = [
    'dashboard',
    'properties',
    'leads',
    'content',
    'users',
    'system_roles',
    'system_logs',
  ];
  return modules.filter((module) => canAccessModule(userRoles, module));
}

export function normalizeBackendRole(roleName: string): Role | null {
  const normalized = roleName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized === 'super admin' || normalized === 'super_admin') return 'SUPER_ADMIN';
  if (normalized === 'super administrador' || normalized === 'super_administrador') {
    return 'SUPER_ADMIN';
  }
  if (normalized === 'admin') return 'ADMIN';
  if (normalized === 'administrador') return 'ADMIN';
  if (normalized === 'marketing') return 'MARKETING';
  if (normalized === 'marketins') return 'MARKETING';
  if (normalized === 'rh' || normalized === 'recursos humanos') return 'RH';
  if (normalized === 'asesor ventas' || normalized === 'asesor_ventas') return 'ASESOR_VENTAS';
  if (normalized === 'coordinador ventas' || normalized === 'coordinador_ventas') {
    return 'COORDINADOR_VENTAS';
  }

  return null;
}

export function getPrimaryRole(userRoles: Role[]): Role | null {
  const priority: Role[] = [
    'SUPER_ADMIN',
    'ADMIN',
    'COORDINADOR_VENTAS',
    'ASESOR_VENTAS',
    'RH',
    'MARKETING',
  ];

  return priority.find((role) => userRoles.includes(role)) ?? null;
}

export function getDefaultDashboardPath(userRoles: Role[]): string {
  if (canAccessModule(userRoles, 'dashboard')) return '/dashboard';
  const firstAvailable = getAvailableModules(userRoles)[0];
  return firstAvailable ? `/modulos/${firstAvailable}` : '/login';
}

export function getUserDisplayName(user: AppUser | null): string {
  if (!user) return 'Usuario';

  if (user.nombres && user.apellidoPaterno) {
    return `${user.nombres} ${user.apellidoPaterno}`.trim();
  }

  const tokens = (user.fullName || '')
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length >= 2) {
    return `${tokens[0]} ${tokens[1]}`;
  }

  return user.fullName || user.email || 'Usuario';
}
