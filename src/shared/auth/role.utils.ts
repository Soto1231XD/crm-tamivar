import type { UserRecord, UserRoleRecord } from '@/interfaces/user.interface';

const ROLE_PRIORITY = [
  'super administrador',
  'super admin',
  'administrador',
  'admin',
  'coordinador de ventas',
  'coordinador ventas',
  'marketing',
  'asesor de ventas',
  'asesor ventas',
  'recursos humanos',
  'rh',
] as const;

export function normalizeRoleName(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function extractUserRoles(user: Pick<UserRecord, 'rol' | 'roles'>): string[] {
  const sourceRoles: UserRoleRecord[] = Array.isArray(user.roles)
    ? user.roles
    : user.rol
      ? [user.rol]
      : [];

  const normalizedRoles = sourceRoles
    .map((role) => {
      if (typeof role === 'string') return role.trim();
      if (typeof role?.rol === 'string') return role.rol.trim();
      if (role?.rol && typeof role.rol === 'object') {
        if (typeof role.rol.rol === 'string') return role.rol.rol.trim();
        if (typeof role.rol.nombre === 'string') return role.rol.nombre.trim();
      }
      if (typeof role?.nombre === 'string') return role.nombre.trim();
      return '';
    })
    .filter(Boolean);

  return Array.from(new Set(normalizedRoles));
}

export function getHighestPriorityRoleLabel(user: Pick<UserRecord, 'rol' | 'roles'>): string {
  const roles = extractUserRoles(user);
  if (roles.length === 0) return 'Sin rol asignado';

  const sortedRoles = [...roles].sort((left, right) => {
    const leftPriority = getRolePriorityIndex(left);
    const rightPriority = getRolePriorityIndex(right);

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return left.localeCompare(right, 'es-MX');
  });

  return sortedRoles[0] ?? 'Sin rol asignado';
}

export function isSuperAdminRole(role: string): boolean {
  const normalizedRole = normalizeRoleName(role);
  return normalizedRole === 'super administrador' || normalizedRole === 'super admin';
}

function getRolePriorityIndex(role: string): number {
  const normalizedRole = normalizeRoleName(role);
  const matchIndex = ROLE_PRIORITY.findIndex((currentRole) => currentRole === normalizedRole);
  return matchIndex === -1 ? Number.MAX_SAFE_INTEGER : matchIndex;
}
