import { create } from "zustand";
import type { AppNotification } from "@/interfaces/notification.interface";
import {
  getUnreadNotificationsCountApi,
  listNotificationsApi,
  markAllNotificationsAsReadApi,
  markNotificationAsReadApi,
} from "@/modules/notifications/services/notifications.api";

interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  hasLoaded: boolean;
  fetchNotifications: (includeRead?: boolean) => Promise<AppNotification[]>;
  fetchUnreadCount: () => Promise<number>;
  refresh: () => Promise<AppNotification[]>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  unreadCount: 0,
  isLoading: false,
  hasLoaded: false,

  fetchNotifications: async (includeRead = false) => {
    set({ isLoading: true });
    try {
      const items = await listNotificationsApi(includeRead);
      set({ items, hasLoaded: true });
      return items;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    const response = await getUnreadNotificationsCountApi();
    set({ unreadCount: response.count });
    return response.count;
  },

  refresh: async () => {
    const [items, unreadCount] = await Promise.all([
      get().fetchNotifications(false),
      get().fetchUnreadCount(),
    ]);
    set({ unreadCount });
    return items;
  },

  markAsRead: async (id: number) => {
    const updated = await markNotificationAsReadApi(id);
    set((state) => {
      const alreadyRead = state.items.find((item) => item.id === id)?.leida_en;
      return {
        items: state.items.map((item) =>
          item.id === id ? { ...item, leida_en: updated.leida_en } : item,
        ),
        unreadCount: alreadyRead
          ? state.unreadCount
          : Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllAsRead: async () => {
    await markAllNotificationsAsReadApi();
    set((state) => ({
      items: state.items.map((item) =>
        item.leida_en
          ? item
          : { ...item, leida_en: new Date().toISOString() }
      ),
      unreadCount: 0,
    }));
  },

  reset: () => set({ items: [], unreadCount: 0, isLoading: false, hasLoaded: false }),
}));
