import { create } from 'zustand';
import { getUsers, type UserRecord } from '../../users/services/users.api';
import {
  createSystemRole,
  getSystemRoles,
  type CreateSystemRolePayload,
  type SystemRoleRecord,
} from '../services/systemRoles.api';

type SystemRolesStore = {
  roles: SystemRoleRecord[];
  users: UserRecord[];
  isLoading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  addRole: (payload: CreateSystemRolePayload) => Promise<SystemRoleRecord>;
};

export const useSystemRolesStore = create<SystemRolesStore>((set) => ({
  roles: [],
  users: [],
  isLoading: false,
  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [roles, users] = await Promise.all([getSystemRoles(), getUsers()]);
      set({ roles, users, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error al cargar los roles del sistema',
        isLoading: false,
      });
    }
  },

  addRole: async (payload: CreateSystemRolePayload) => {
    set({ isLoading: true, error: null });
    try {
      const createdRole = await createSystemRole(payload);
      set((state) => ({
        roles: [createdRole, ...state.roles],
        isLoading: false,
      }));
      return createdRole;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear el rol';
      set({ error: message, isLoading: false });
      throw error;
    }
  },
}));
