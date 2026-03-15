import { create } from 'zustand';
import {
  createUser,
  getRoles,
  getUsers,
  toggleUserStatus,
  updateUser,
  type CreateUserPayload,
  type RoleOptionRecord,
  type ToggleUserStatusResponse,
  type UpdateUserPayload,
  type UserRecord,
} from '../services/users.api';

type UsersState = {
  users: UserRecord[];
  rolesCatalog: RoleOptionRecord[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  fetchRolesCatalog: () => Promise<void>;
  addUser: (payload: CreateUserPayload) => Promise<UserRecord>;
  editUser: (id: number, payload: UpdateUserPayload) => Promise<UserRecord>;
  toggleStatus: (id: number) => Promise<ToggleUserStatusResponse>;
};

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  rolesCatalog: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const users = await getUsers();
      set({ users, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar los usuarios',
        isLoading: false,
      });
    }
  },

  fetchRolesCatalog: async () => {
    set({ error: null });
    try {
      const rolesCatalog = await getRoles();
      set({ rolesCatalog });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar los roles',
      });
    }
  },

  addUser: async (payload: CreateUserPayload) => {
    set({ isLoading: true, error: null });
    try {
      const createdUser = await createUser(payload);
      set((state) => ({
        users: [createdUser, ...state.users],
        isLoading: false,
      }));
      return createdUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear el usuario';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  editUser: async (id: number, payload: UpdateUserPayload) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await updateUser(id, payload);
      set((state) => ({
        users: state.users.map((user) => (user.id === id ? updatedUser : user)),
        isLoading: false,
      }));
      return updatedUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar el usuario';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  toggleStatus: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await toggleUserStatus(id);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? { ...user, activo: response.activo } : user,
        ),
        isLoading: false,
      }));
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar el estado del usuario';
      set({ error: message, isLoading: false });
      throw error;
    }
  },
}));
