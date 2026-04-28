import { useEffect, useMemo, useState } from "react";
import type {
  CreateSystemRolePayload,
  PermissionRecord,
  SystemRoleRecord,
  UpdateSystemRolePayload,
} from "@/interfaces/system-role.interface";
import type { UserRecord } from "@/interfaces/user.interface";
import toast from "react-hot-toast";
import { FilterCard, FilterSearchInput } from "@/components/ui/AppFilters";
import agregarIcon from "../../../assets/images/Agregar.png";
import borrarIcon from "../../../assets/images/Borrar.png";
import editarDosIcon from "../../../assets/images/editar2.png";
import { extractUserRoles, normalizeRoleName } from "@/shared/auth/role.utils";
import { useAuthStore } from "@/shared/auth/useAuthStore";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import { getUsers } from "../../users/services/users.api";
import { AssignedModulesModal } from "../components/AssignedModulesModal";
import { CreateRoleModal } from "../components/CreateRoleModal";
import { EditRoleModal } from "../components/EditRoleModal";
import { DeleteRoleConfirmModal } from "../components/DeleteRoleConfirmModal";
import {
  createSystemRole,
  deleteSystemRole,
  getSystemRoles,
  updateSystemRole,
} from "../services/systemRoles.api";

export function SystemRolesPage() {
  const accessToken = useAuthStore((state) => state.token);
  const { can } = useHasPermission();

  const canCreate = can("roles", "crear");

  const [roles, setRoles] = useState<SystemRoleRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<SystemRoleRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<SystemRoleRecord | null>(null);
  const [deletingRole, setDeletingRole] = useState<SystemRoleRecord | null>(null);

  useEffect(() => {
    if (!accessToken) return;

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
    const query = normalizeRoleName(search);
    return roles.filter((role) => query.length === 0 || normalizeRoleName(role.rol).includes(query));
  }, [roles, search]);

  const availablePermissions = useMemo(() => {
    const permissionsMap = new Map<number, PermissionRecord>();

    roles.forEach((role) => {
      (role.permisos ?? []).forEach((permissionEntry) => {
        const permission = permissionEntry?.permiso;
        if (!permission || typeof permission.id !== "number") return;
        permissionsMap.set(permission.id, permission);
      });
    });

    return Array.from(permissionsMap.values()).sort((left, right) => {
      const moduleCompare = left.modulo.localeCompare(right.modulo);
      return moduleCompare !== 0 ? moduleCompare : left.accion.localeCompare(right.accion);
    });
  }, [roles]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Roles del sistema</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Define permisos y niveles de acceso del CRM
          </p>
        </div>
        <button
          type="button"
          disabled={!canCreate}
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <img src={agregarIcon} alt="" className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span>Nuevo rol</span>
        </button>
      </header>

      <FilterCard description="Busca un rol por nombre para localizarlo mas rápido.">
        <div className="md:max-w-sm">
          <FilterSearchInput
            type="text"
            placeholder="Buscar rol"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </FilterCard>

      <section>
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
            Cargando roles...
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
            <p className="font-semibold text-slate-700">Sin resultados</p>
            <p className="mt-1">No se encontraron roles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRoles.map((role) => (
              <article
                key={role.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="border-b border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98))] px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rol del sistema</p>
                  <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{role.rol}</h3>
                </div>

                <div className="flex flex-col gap-5 px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="grid min-w-0 flex-1 gap-4 md:grid-cols-[1.4fr_0.7fr]">
                    <InfoBlock label="Descripción del rol" value={getRoleDescription(role.rol)} />
                    <InfoBlock label="Usuarios asignados" value={String(getAssignedUsersCount(role, users))} />
                  </div>

                  <div className="flex flex-col gap-3 xl:items-end xl:self-stretch">
                    <button
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-[#5980FF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#456df4] xl:w-auto"
                    >
                      Módulos asignados
                    </button>

                    {isProtectedRole(role.rol) ? (
                      <div className="w-full max-w-[320px] rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-slate-700 xl:mt-auto">
                        Este es un rol base del sistema y no puede editarse ni eliminarse desde esta vista.
                      </div>
                    ) : (
                      <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingRole(role)}
                          className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3.5 py-2.5 text-sm font-semibold text-[#312C85] transition-colors hover:bg-indigo-100"
                        >
                          <img src={editarDosIcon} alt="" className="h-5 w-5 shrink-0" aria-hidden="true" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingRole(role)}
                          className="inline-flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3.5 py-2.5 text-sm font-semibold text-[#CA5874] transition-colors hover:bg-orange-100"
                        >
                          <img src={borrarIcon} alt="" className="h-5 w-5 shrink-0" aria-hidden="true" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )}
                  </div>
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

      {canCreate && (
        <CreateRoleModal
          isOpen={isCreateModalOpen}
          permissions={availablePermissions}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateRole}
        />
      )}

      <EditRoleModal
        isOpen={Boolean(editingRole)}
        role={editingRole}
        permissions={availablePermissions}
        onClose={() => setEditingRole(null)}
        onEdit={handleEditRole}
      />

      <DeleteRoleConfirmModal
        isOpen={Boolean(deletingRole)}
        role={deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDeleteRole}
      />
    </div>
  );

  async function handleCreateRole(payload: CreateSystemRolePayload): Promise<string | null> {
    try {
      if (!accessToken) throw new Error("No se encontró el token de acceso.");

      const createdRole = await createSystemRole(payload, accessToken);
      setRoles((prev) => [createdRole, ...prev]);
      toast.success("El rol se creo con éxito.");
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "No fue posible crear el rol.";
    }
  }

  async function handleEditRole(payload: UpdateSystemRolePayload): Promise<string | null> {
    try {
      if (!accessToken) throw new Error("No se encontró el token de acceso.");
      if (!editingRole) throw new Error("No se encontró el rol a editar.");

      const updatedRole = await updateSystemRole(editingRole.id, payload, accessToken);
      setRoles((prev) => prev.map((role) => (role.id === updatedRole.id ? updatedRole : role)));
      setEditingRole(null);
      toast.success("El rol se actualizo con éxito.");
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "No fue posible actualizar el rol.";
    }
  }

  async function handleDeleteRole(roleId: number): Promise<string | null> {
    try {
      if (!accessToken) throw new Error("No se encontró el token de acceso.");

      await deleteSystemRole(roleId, accessToken);
      setRoles((prev) => prev.filter((role) => role.id !== roleId));
      setDeletingRole(null);
      toast.success("El rol se elimino con éxito.");
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "No fue posible eliminar el rol.";
    }
  }
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function getAssignedUsersCount(role: SystemRoleRecord, users: UserRecord[]): number {
  const targetRole = normalizeRoleName(role.rol);
  return users.filter((user) =>
    getUserRoles(user).some((userRole) => normalizeRoleName(userRole) === targetRole),
  ).length;
}

function getRoleDescription(roleName: string): string {
  const normalized = normalizeRoleName(roleName);
  if (normalized === "super admin" || normalized === "super administrador") {
    return "Control total del CRM y administración completa del sistema.";
  }
  if (normalized === "admin" || normalized === "administrador") {
    return "Gestión operativa del CRM con acceso amplio a los módulos principales.";
  }
  if (normalized === "marketing") {
    return "Gestión de contenido y apoyo en estrategias de difusión.";
  }
  if (normalized === "rh" || normalized === "recursos humanos") {
    return "Consulta y gestión enfocada al módulo de usuarios.";
  }
  if (normalized === "asesor ventas" || normalized === "asesor de ventas") {
    return "Seguimiento comercial de propiedades y registros.";
  }
  if (normalized === "coordinador ventas" || normalized === "coordinador de ventas") {
    return "Supervision comercial y coordinación del flujo de ventas.";
  }
  return "Rol configurado dentro del CRM para controlar accesos y permisos.";
}

function getUserRoles(user: UserRecord): string[] {
  return extractUserRoles(user);
}

function isProtectedRole(roleName: string): boolean {
  const normalized = normalizeRoleName(roleName);
  return [
    "super admin",
    "super administrador",
    "admin",
    "administrador",
    "marketing",
    "rh",
    "recursos humanos",
    "coordinador ventas",
    "coordinador de ventas",
    "asesor ventas",
    "asesor de ventas",
  ].includes(normalized);
}
