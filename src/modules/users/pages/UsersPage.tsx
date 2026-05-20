import { useEffect, useMemo, useState } from "react";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserRecord,
} from "@/interfaces/user.interface";
import toast from "react-hot-toast";
import {
  FilterCard,
  FilterSearchInput,
  FilterSelect,
} from "@/components/ui/AppFilters";
import { getSoftBadgeStyles } from "@/components/ui/badgeStyles";
import agregarIcon from "../../../assets/images/Agregar.png";
import borrarIcon from "../../../assets/images/Borrar.png";
import editarDosIcon from "../../../assets/images/editar2.png";
import {
  extractUserRoles,
  getHighestPriorityRoleLabel,
  isSuperAdminRole,
  normalizeRoleName,
} from "@/shared/auth/role.utils";
import { useAuthStore } from "@/shared/auth/useAuthStore";
import { useHasPermission } from "@/shared/auth/permissions/useHasPermission";
import { getFullImageUrl } from "@/shared/utils/imageUrl";
import { UserModal } from "../components/UserModal";
import { useUsersStore } from "../store/useUsersStore";
import { processImageToWebP } from "@/shared/utils/imageProcessor";
import { getReadableErrorMessage } from "@/shared/utils/errorMessages";

const ALL_USER_STATES = "Todos los estados";

export function UsersPage() {
  const sessionUser = useAuthStore((state) => state.user);
  const { can } = useHasPermission();

  const canCreate = can("usuarios", "crear");
  const canEdit = can("usuarios", "actualizar");
  const canDelete = can("usuarios", "eliminar");

  const {
    users,
    rolesCatalog,
    isLoading,
    fetchUsers,
    fetchRolesCatalog,
    addUser,
    editUser,
    toggleStatus,
  } = useUsersStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_USER_STATES);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    void fetchRolesCatalog();
  }, [fetchRolesCatalog]);

  const filteredUsers = useMemo(() => {
    const query = normalizeRoleName(search);

    return users.filter((user) => {
      const matchesSearch =
        query.length === 0 ||
        normalizeRoleName(user.nombres).includes(query) ||
        normalizeRoleName(user.apellido_paterno).includes(query) ||
        normalizeRoleName(user.apellido_materno).includes(query) ||
        normalizeRoleName(user.codigo_usuario).includes(query);
      const matchesStatus =
        statusFilter === ALL_USER_STATES ||
        getUserStatusLabel(user.activo) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, users]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Usuarios
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Gestiona usuarios, estados y roles dentro del CRM.
          </p>
        </div>
        <button
          type="button"
          disabled={!canCreate}
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#312C85] px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <img
            src={agregarIcon}
            alt=""
            className="h-6 w-6 shrink-0"
            aria-hidden="true"
          />
          <span>Nuevo usuario</span>
        </button>
      </header>

      <FilterCard description="Busca usuarios por nombre y filtra por estado para ubicar información más rápido.">
        <div className="grid gap-3 md:grid-cols-2 lg:max-w-[540px]">
          <FilterSearchInput
            type="text"
            placeholder="Buscar usuario"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <FilterSelect
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {[ALL_USER_STATES, "Activo", "Baja"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>
        </div>
      </FilterCard>

      <section>
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
            Cargando usuarios...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-600 shadow-sm">
            <p className="font-semibold text-slate-700">Sin resultados</p>
            <p className="mt-1">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => {
              const roles = getUserRoles(user);
              const primaryRole = getHighestPriorityRoleLabel(user);
              const extraRolesCount = Math.max(roles.length - 1, 0);
              const isSuperAdmin = roles.some((role) => isSuperAdminRole(role));

              const isCurrentUser = sessionUser?.id === user.id;
              const canEditThisUser =
                canEdit && (!isSuperAdmin || isCurrentUser);
              const canToggleThisUser =
                canDelete && !isSuperAdmin && !isCurrentUser;

              return (
                <article
                  key={user.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-bold text-slate-600 shadow-sm">
                        {user.foto_url ? (
                          <img
                            src={getFullImageUrl(user.foto_url)}
                            alt={getUserFullName(user)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>
                            {`${user.nombres?.[0] || ""}${user.apellido_paterno?.[0] || ""}`.toUpperCase() ||
                              "U"}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Usuario
                        </p>
                        <h3 className="mt-2 break-words text-lg font-bold tracking-tight text-slate-900">
                          {getUserFullName(user)}
                        </h3>
                        <span
                          className="mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                          style={getSoftBadgeStyles("blue")}
                        >
                          {user.codigo_usuario?.trim() || "Sin ID"}
                        </span>
                        <p className="mt-1 break-all text-sm leading-6 text-slate-600">
                          {user.correo_electronico?.trim() ||
                            "Sin correo electrónico"}
                        </p>
                      </div>
                    </div>
                    <span
                      className="inline-flex shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm"
                      style={getUserStatusStyles(user.activo)}
                    >
                      {getUserStatusLabel(user.activo)}
                    </span>
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-slate-700">
                        Rol principal
                      </p>
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                        {roles.length} {roles.length === 1 ? "rol" : "roles"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {roles.length > 0 ? (
                        <>
                          <span
                            className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
                            style={getSoftBadgeStyles("indigo")}
                          >
                            {primaryRole}
                          </span>
                          {extraRolesCount > 0 ? (
                            <span
                              className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold"
                              style={getSoftBadgeStyles("slate")}
                            >
                              +{extraRolesCount}{" "}
                              {extraRolesCount === 1
                                ? "rol adicional"
                                : "roles adicionales"}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-sm text-slate-500">
                          Sin roles asignados
                        </span>
                      )}
                    </div>
                  </div>

                  {canEditThisUser || canToggleThisUser ? (
                    <div className="mt-5 grid grid-cols-1 gap-2 border-t border-slate-200 pt-4 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
                      {canEditThisUser && (
                        <button
                          type="button"
                          onClick={() => setEditingUser(user)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3.5 py-2.5 text-sm font-semibold text-[#312C85] transition-colors hover:bg-indigo-100 sm:w-auto"
                        >
                          <img
                            src={editarDosIcon}
                            alt=""
                            className="h-5 w-5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>Editar</span>
                        </button>
                      )}

                      {canToggleThisUser && (
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(user)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3.5 py-2.5 text-sm font-semibold text-[#CA5874] transition-colors hover:bg-orange-100 sm:w-auto"
                        >
                          <img
                            src={borrarIcon}
                            alt=""
                            className="h-5 w-5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            {user.activo === false
                              ? "Reactivar"
                              : "Dar de baja"}
                          </span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 border-t border-slate-200 pt-4">
                      <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-slate-700">
                        {isSuperAdmin && isCurrentUser ? (
                          <span>
                            Tu perfil cuenta con el rol Super Administrador.
                            Puedes actualizar tu información, pero no darte de
                            baja desde esta vista.
                          </span>
                        ) : isSuperAdmin ? (
                          <span>
                            Este usuario pertenece a un perfil de alto rango. Su
                            información no se puede manipular desde esta vista.
                          </span>
                        ) : (
                          <span>
                            Este usuario corresponde a tu sesión actual y no
                            puede manipularse desde esta vista.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Renderizamos modales solo si tiene permiso de abrirlos */}
      {canCreate && (
        <UserModal
          isOpen={isCreateModalOpen}
          mode="create"
          roles={rolesCatalog}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {canEdit && (
        <UserModal
          isOpen={Boolean(editingUser)}
          mode="edit"
          user={editingUser}
          roles={rolesCatalog}
          onClose={() => setEditingUser(null)}
          onSubmit={(payload, photoFile) =>
            editingUser
              ? handleEditUser(
                  editingUser.id,
                  payload as UpdateUserPayload,
                  photoFile,
                )
              : Promise.resolve("Usuario no valido.")
          }
        />
      )}
    </div>
  );

  async function handleCreateUser(
    payload: CreateUserPayload | UpdateUserPayload,
    photoFile?: File | null,
  ): Promise<string | null> {
    try {
      let optimizedPhoto = photoFile;
      // Solo procesamos si el usuario seleccionó una imagen
      if (photoFile) {
        optimizedPhoto = await processImageToWebP(photoFile, 500);
      }

      await addUser(payload as CreateUserPayload, optimizedPhoto);
      toast.success("El usuario se creó con éxito.");
      return null;
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "No fue posible crear el usuario.";
    }
  }

  async function handleEditUser(
    userId: number,
    payload: UpdateUserPayload,
    photoFile?: File | null,
  ): Promise<string | null> {
    try {
      let optimizedPhoto = photoFile;

      // Aplicamos la misma lógica para la edición
      if (photoFile) {
        optimizedPhoto = await processImageToWebP(photoFile, 500);
      }

      await editUser(userId, payload, optimizedPhoto);
      toast.success("El usuario se actualizó con éxito.");
      return null;
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "No fue posible actualizar el usuario.";
    }
  }

  async function handleToggleUserStatus(targetUser: UserRecord) {
    try {
      const response = await toggleStatus(targetUser.id);
      toast.success(
        response.activo === false
          ? `Se dio de baja a ${getUserFullName(targetUser)}.`
          : `Se reactivó a ${getUserFullName(targetUser)}.`,
      );
    } catch (error) {
      toast.error(
        getReadableErrorMessage(
          error,
          "No fue posible actualizar el estado del usuario.",
        ),
      );
    }
  }
}

function getUserStatusLabel(isActive?: boolean | null): "Activo" | "Baja" {
  return isActive === false ? "Baja" : "Activo";
}

function getUserStatusStyles(isActive?: boolean | null): {
  backgroundColor: string;
  color: string;
} {
  if (isActive === false) {
    const tone = getSoftBadgeStyles("amber");
    return { backgroundColor: tone.backgroundColor, color: "#CA5874" };
  }

  const tone = getSoftBadgeStyles("green");
  return { backgroundColor: tone.backgroundColor, color: tone.color };
}

function getUserFullName(user: UserRecord): string {
  const parts = [user.nombres, user.apellido_paterno]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : "Sin nombre";
}

function getUserRoles(user: UserRecord): string[] {
  return extractUserRoles(user);
}
