import type { ModuleKey } from './interfaces/rbac.interface';

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  propiedades: 'Propiedades',
  registros: 'Registros',
  blogs: 'Blogs',
  usuarios: 'Usuarios',
  roles: 'Roles del sistema',
  movimientos: 'Movimientos',
};

export function getAvailableModules(permissions: string[]): ModuleKey[] {
  const allModules: ModuleKey[] = [
    'dashboard',
    'propiedades',
    'registros',
    'blogs',
    'usuarios',
    'roles',
    'movimientos',
  ];

  // Si tiene el comodín absoluto, tiene acceso a todos los módulos
  if (permissions.includes('*:*')) return allModules;

  return allModules.filter((module) => {
    if (module === 'dashboard') return true; 

    // Muestra el módulo en el Sidebar si tiene cualquier permiso relacionado a él
    return permissions.some((p) => p.startsWith(`${module}:`));
  });
}

export function getDefaultDashboardPath(permissions: string[]): string {
  const availableModules = getAvailableModules(permissions);
  
  if (availableModules.includes('dashboard')) return '/dashboard';
  
  const firstAvailable = availableModules.filter((m) => m !== 'dashboard')[0];
  return firstAvailable ? `/modulos/${firstAvailable}` : '/login';
}