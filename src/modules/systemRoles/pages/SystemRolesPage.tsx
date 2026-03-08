import { useEffect, useMemo, useState } from 'react';
import agregarIcon from '../../../assets/images/Agregar.png';
import { useAuth } from '../../../shared/context/AuthContext';
import { getUsers, type UserRecord } from '../../users/services/users.api';
import { AssignedModulesModal } from '../components/AssignedModulesModal';
import { CreateRoleModal } from '../components/CreateRoleModal';
import { createSystemRole, type PermissionRecord, getSystemRoles, type SystemRoleRecord } from '../services/systemRoles.api';

export function SystemRolesPage() {
  const { accessToken } = useAuth();
  const [roles, setRoles] = useState<SystemRoleRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<SystemRoleRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    Promise.all([getSystemRoles(accessToken), getUsers(accessToken)])
      .then(([rolesData, usersData]) => {
        if (!active) return;
        setRoles(rolesData);
        setUsers(usersData);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  const filteredRoles = useMemo(() => {
    const query = normalizeText(search);
    return roles.filter((role) => query.length === 0 || normalizeText(role.rol).includes(query));
  }, [roles, search]);

  const availablePermissions = useMemo(() => {
    const permissionsMap = new Map<number, PermissionRecord>();

    roles.forEach((role) => {
      (role.permisos ?? []).forEach((permissionEntry) => {
        const permission = permissionEntry?.permiso;
        if (!permission || typeof permission.id !== 'number') return;
        permissionsMap.set(permission.id, permission);
      });
    });

    return Array.from(permissionsMap.values()).sort((left, right) => {
      const moduleCompare = left.modulo.localeCompare(right.modulo);
      return moduleCompare !== 0 ? moduleCompare : left.accion.localeCompare(right.accion);
    });
  }, [roles]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Roles del sistema</h2>
          <p className="mt-1 text-sm text-slate-600">Define permisos y niveles de acceso del CRM</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Nuevo rol</span>
        </button>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="Buscar rol"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
        />
      </section>

      <section>
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
            Cargando roles...
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
            No se encontraron roles
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRoles.map((role) => (
              <article
                key={role.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="grid flex-1 gap-3 md:grid-cols-3">
                  <InfoBlock label="Rol" value={role.rol} />
                  <InfoBlock label="Descripcion del rol" value={getRoleDescription(role.rol)} />
                  <InfoBlock label="Usuarios asignados" value={String(getAssignedUsersCount(role, users))} />
                </div>

                <div className="flex justify-start lg:justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className="inline-flex items-center justify-center rounded-lg bg-[#5980FF] px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  >
                    Modulos asignados
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <AssignedModulesModal
        isOpen={Boolean(selectedRole)}
        role={selectedRole}
        onClose={() => setSelectedRole(null)}
      />
      <CreateRoleModal
        isOpen={isCreateModalOpen}
        permissions={availablePermissions}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateRole}
      />
    </div>
  );

  async function handleCreateRole(payload: { rol: string; permisosIds: number[] }): Promise<string | null> {
    try {
      const createdRole = await createSystemRole(payload, accessToken);
      setRoles((prev) => [createdRole, ...prev]);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible crear el rol.';
    }
  }
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{label}:</p>
      <p className="mt-1 text-sm text-slate-600">{value}</p>
    </div>
  );
}

function getAssignedUsersCount(role: SystemRoleRecord, users: UserRecord[]): number {
  const targetRole = normalizeText(role.rol);
  return users.filter((user) => getUserRoles(user).some((userRole) => normalizeText(userRole) === targetRole)).length;
}

function getRoleDescription(roleName: string): string {
  const normalized = normalizeText(roleName);
  if (normalized === 'super admin' || normalized === 'super administrador') {
    return 'Control total del CRM y administracion completa del sistema.';
  }
  if (normalized === 'admin' || normalized === 'administrador') {
    return 'Gestion operativa del CRM con acceso amplio a los modulos principales.';
  }
  if (normalized === 'marketing') {
    return 'Gestion de contenido y apoyo en estrategias de difusion.';
  }
  if (normalized === 'rh' || normalized === 'recursos humanos') {
    return 'Consulta y gestion enfocada al modulo de usuarios.';
  }
  if (normalized === 'asesor ventas' || normalized === 'asesor de ventas') {
    return 'Seguimiento comercial de propiedades y registros.';
  }
  if (normalized === 'coordinador ventas' || normalized === 'coordinador de ventas') {
    return 'Supervision comercial y coordinacion del flujo de ventas.';
  }
  return 'Rol configurado dentro del CRM para controlar accesos y permisos.';
}

function getUserRoles(user: UserRecord): string[] {
  const sourceRoles = Array.isArray(user.roles) ? user.roles : user.rol ? [user.rol] : [];

  return Array.from(
    new Set(
      sourceRoles
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
        .filter(Boolean),
    ),
  );
}

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
