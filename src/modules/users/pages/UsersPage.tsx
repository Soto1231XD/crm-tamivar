import { useEffect, useMemo, useState } from 'react';
import agregarIcon from '../../../assets/images/Agregar.png';
import borrarIcon from '../../../assets/images/Borrar.png';
import editarDosIcon from '../../../assets/images/editar2.png';
import { useAuth } from '../../../shared/context/AuthContext';
import { UserModal } from '../components/UserModal';
import {
  createUser,
  getRoles,
  getUsers,
  toggleUserStatus,
  updateUser,
  type CreateUserPayload,
  type RoleOptionRecord,
  type UpdateUserPayload,
  type UserRecord,
  type UserRoleRecord,
} from '../services/users.api';

const ALL_USER_STATES = 'Todos los estados';

export function UsersPage() {
  const { accessToken, user: sessionUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [rolesCatalog, setRolesCatalog] = useState<RoleOptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL_USER_STATES);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getUsers(accessToken)
      .then((data) => {
        if (!active) return;
        setUsers(data);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  useEffect(() => {
    let active = true;

    getRoles(accessToken).then((data) => {
      if (!active) return;
      setRolesCatalog(data);
    });

    return () => {
      active = false;
    };
  }, [accessToken]);

  const filteredUsers = useMemo(() => {
    const query = normalizeText(search);

    return users.filter((user) => {
      const matchesSearch = query.length === 0 || normalizeText(user.nombres).includes(query);
      const matchesStatus =
        statusFilter === ALL_USER_STATES || getUserStatusLabel(user.activo) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, users]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Usuarios</h2>
          <p className="mt-1 text-sm text-slate-600">Gestiona usuarios y asigna roles</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Nuevo usuario</span>
        </button>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Buscar usuario"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-700 focus:ring"
          >
            {[ALL_USER_STATES, 'Activo', 'Baja'].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section>
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
            Cargando usuarios...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
            No se encontraron usuarios
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => {
              const roles = getUserRoles(user);
              const isSuperAdmin = roles.some((role) => {
                const normalizedRole = normalizeText(role);
                return normalizedRole === 'super admin' || normalizedRole === 'super administrador';
              });

              return (
                <article key={user.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-slate-900">
                        {getUserFullName(user)}
                      </h3>
                      <p className="mt-1 truncate text-sm text-slate-600">
                        {user.correo_electronico?.trim() || 'Sin correo electronico'}
                      </p>
                    </div>
                    <span
                      className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={getUserStatusStyles(user.activo)}
                    >
                      {getUserStatusLabel(user.activo)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-700">Roles</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <span
                            key={`${user.id}-${role}`}
                            className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: '#E0E7FF', color: '#1480F0' }}
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">Sin roles asignados</span>
                      )}
                    </div>
                  </div>

                  {!isSuperAdmin ? (
                    <div className="mt-5 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingUser(user)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#312C85]"
                        style={{ backgroundColor: '#E0E7FF', boxShadow: 'inset 0 0 0 999px rgba(199, 210, 254, 0.2)' }}
                      >
                        <img src={editarDosIcon} alt="" className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(user)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#CA5874]"
                        style={{ backgroundColor: '#FFEDD4' }}
                      >
                        <img src={borrarIcon} alt="" className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span>Dar de baja</span>
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <UserModal
        isOpen={isCreateModalOpen}
        mode="create"
        roles={rolesCatalog}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />
      <UserModal
        isOpen={Boolean(editingUser)}
        mode="edit"
        user={editingUser}
        roles={rolesCatalog}
        onClose={() => setEditingUser(null)}
        onSubmit={(payload) => (editingUser ? handleEditUser(editingUser.id, payload as UpdateUserPayload) : Promise.resolve('Usuario no valido.'))}
      />
    </div>
  );

  async function handleCreateUser(payload: CreateUserPayload | UpdateUserPayload): Promise<string | null> {
    try {
      const createdUser = await createUser(
        {
          ...(payload as CreateUserPayload),
          creado_por_id: sessionUser?.id,
        },
        accessToken,
      );
      setUsers((prev) => [createdUser, ...prev]);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible crear el usuario.';
    }
  }

  async function handleEditUser(userId: number, payload: UpdateUserPayload): Promise<string | null> {
    try {
      const updatedUser = await updateUser(userId, payload, accessToken);
      setUsers((prev) => prev.map((currentUser) => (currentUser.id === userId ? updatedUser : currentUser)));
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No fue posible actualizar el usuario.';
    }
  }

  async function handleToggleUserStatus(targetUser: UserRecord) {
    try {
      const response = await toggleUserStatus(targetUser.id, accessToken);
      setUsers((prev) =>
        prev.map((currentUser) =>
          currentUser.id === targetUser.id ? { ...currentUser, activo: response.activo } : currentUser,
        ),
      );
    } catch {
      // noop
    }
  }
}

function getUserStatusLabel(isActive?: boolean | null): 'Activo' | 'Baja' {
  return isActive === false ? 'Baja' : 'Activo';
}

function getUserStatusStyles(isActive?: boolean | null): { backgroundColor: string; color: string } {
  if (isActive === false) {
    return { backgroundColor: '#FFEDD4', color: '#CA5874' };
  }

  return { backgroundColor: '#DBFCE7', color: '#4D8236' };
}

function getUserFullName(user: UserRecord): string {
  const parts = [user.nombres, user.apellido_paterno]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(' ') : 'Sin nombre';
}

function getUserRoles(user: UserRecord): string[] {
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

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
