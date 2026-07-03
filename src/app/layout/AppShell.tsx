import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { getHighestPriorityRoleLabel } from "@/shared/auth/role.utils";
import { useAuthStore } from "@/shared/auth/useAuthStore";
import { getFullImageUrl } from "@/shared/utils/imageUrl";
import { useNotificationsStore } from "@/modules/notifications/store/useNotificationsStore";
import { useThemeStore } from "@/shared/theme/useThemeStore";
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification,
  type BrowserNotificationPermissionState,
} from "@/modules/notifications/utils/browserNotifications";
import {
  disconnectPushNotifications,
  getPushSubscriptionStatus,
  subscribeToPushNotifications,
  type PushSubscriptionStatus,
} from "@/modules/notifications/utils/pushNotifications";
import { getAvailableModules, MODULE_LABELS, MODULE_PATHS } from "@/shared/auth/navigation.util";
import type { ModuleKey } from "@/shared/auth/interfaces/rbac.interface";
import type { AppNotification } from "@/interfaces/notification.interface";
import MenuIcon from "@/assets/images/Menu.png";
import { MODULE_ICONS, NAV_GROUP_CONFIGS, STANDALONE_MODULES } from "./nav.config";
import { getPageTitle } from "./notifications.utils";
import { BellIcon } from "./components/AppIcons";
import { Sidebar } from "./components/Sidebar";
import { NotificationsPanel } from "./components/NotificationsPanel";
import { ProfilePanel } from "./components/ProfilePanel";

export function AppShell() {
  const user = useAuthStore((state) => state.user);
  const performLogout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const notifications = useNotificationsStore((state) => state.items);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const hasLoadedNotifications = useNotificationsStore((state) => state.hasLoaded);
  const refreshNotifications = useNotificationsStore((state) => state.refresh);
  const markNotificationAsRead = useNotificationsStore((state) => state.markAsRead);
  const markAllNotificationsAsRead = useNotificationsStore((state) => state.markAllAsRead);
  const resetNotifications = useNotificationsStore((state) => state.reset);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [browserNotificationPermission, setBrowserNotificationPermission] =
    useState<BrowserNotificationPermissionState>(() => getBrowserNotificationPermission());
  const [pushSubscriptionStatus, setPushSubscriptionStatus] =
    useState<PushSubscriptionStatus>("idle");
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const hasBootstrappedNotifications = useRef(false);
  const notifiedIdsRef = useRef<Set<number>>(new Set());

  const permissions = user?.permisos ?? [];
  const availableModules = getAvailableModules(permissions, user?.roles ?? []);
  const isDark = theme === "dark";
  const primaryRoleDisplay = user ? getHighestPriorityRoleLabel(user) : "Sin rol asignado";
  const pageTitle = getPageTitle(location.pathname);
  const displayName = user
    ? `${user.nombres || ""} ${user.apellido_paterno || ""}`.trim() || user.correo_electronico
    : "Usuario";

  const navItems = availableModules.map((module: ModuleKey) => ({
    to: MODULE_PATHS[module],
    label: MODULE_LABELS[module] || module,
    icon: MODULE_ICONS[module],
  }));
  const standaloneNavItems = availableModules
    .filter((m) => STANDALONE_MODULES.has(m))
    .map((m) => ({ to: MODULE_PATHS[m], label: MODULE_LABELS[m] || m, icon: MODULE_ICONS[m] }));
  const activeNavGroups = NAV_GROUP_CONFIGS.map((group) => ({
    ...group,
    items: group.modules
      .filter((m) => availableModules.includes(m))
      .map((m) => ({ to: MODULE_PATHS[m], label: MODULE_LABELS[m] || m, icon: MODULE_ICONS[m] })),
  })).filter((group) => group.items.length > 0);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const current = NAV_GROUP_CONFIGS.find((g) =>
      g.modules.some((m) => location.pathname.startsWith(MODULE_PATHS[m]))
    );
    return new Set(current ? [current.label] : []);
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  useEffect(() => {
    setBrowserNotificationPermission(getBrowserNotificationPermission());
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) { setPushSubscriptionStatus("idle"); return; }
    let isCancelled = false;
    const sync = async () => {
      try {
        const status = await getPushSubscriptionStatus();
        if (isCancelled) return;
        setPushSubscriptionStatus(status);
        if (status === "subscribed") await subscribeToPushNotifications();
      } catch (error) {
        if (!isCancelled) console.error("No pudimos sincronizar el estado de push.", error);
      }
    };
    void sync();
    return () => { isCancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      resetNotifications();
      hasBootstrappedNotifications.current = false;
      notifiedIdsRef.current = new Set();
      return;
    }
    let isCancelled = false;
    const sync = async () => {
      try {
        const items = await refreshNotifications();
        if (isCancelled) return;
        const nextUnreadIds = new Set(items.filter((i) => !i.leida_en).map((i) => i.id));
        if (hasBootstrappedNotifications.current) {
          items
            .filter((i) => !i.leida_en && !notifiedIdsRef.current.has(i.id))
            .slice(0, 3)
            .forEach((i) => {
              toast(i.titulo ? `${i.titulo}: ${i.mensaje}` : i.mensaje, { duration: 5000 });
              showBrowserNotification(i, () => { void handleNotificationClick(i); });
            });
        }
        notifiedIdsRef.current = nextUnreadIds;
        hasBootstrappedNotifications.current = true;
      } catch (error) {
        if (!isCancelled && !hasLoadedNotifications) console.error("No pudimos cargar las notificaciones.", error);
      }
    };
    void sync();
    const intervalId = window.setInterval(() => { void sync(); }, 60000);
    return () => { isCancelled = true; window.clearInterval(intervalId); };
  }, [hasLoadedNotifications, pushSubscriptionStatus, refreshNotifications, resetNotifications, user?.id]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const current = NAV_GROUP_CONFIGS.find((g) =>
      g.modules.some((m) => location.pathname.startsWith(MODULE_PATHS[m]))
    );
    if (current) setOpenGroups((prev) => new Set([...prev, current.label]));
  }, [location.pathname]);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    let isCancelled = false;
    const enable = async () => {
      let permission = browserNotificationPermission;
      if (permission === "default") {
        permission = await requestBrowserNotificationPermission();
        if (!isCancelled) setBrowserNotificationPermission(permission);
      }
      if (permission !== "granted" || isCancelled) return;
      try {
        const status = await subscribeToPushNotifications();
        if (!isCancelled) setPushSubscriptionStatus(status);
      } catch (error) {
        if (!isCancelled) {
          console.error("No pudimos activar las notificaciones push.", error);
          setPushSubscriptionStatus("unavailable");
          toast.error("No pudimos activar las notificaciones externas.");
        }
      }
    };
    void enable();
    return () => { isCancelled = true; };
  }, [browserNotificationPermission, isNotificationsOpen]);

  const handleLogout = () => {
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
    performLogout();
    navigate("/login", { replace: true });
    void disconnectPushNotifications().catch((e) =>
      console.error("No pudimos desactivar las notificaciones push al salir.", e)
    );
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.leida_en) await markNotificationAsRead(notification.id);
    setIsNotificationsOpen(false);
    if (notification.modulo === "registros") { navigate(MODULE_PATHS.registros); return; }
    if (notification.modulo === "registros_leads") navigate(MODULE_PATHS.registros_leads);
  };

  return (
    <div className="h-screen overflow-hidden bg-[var(--crm-bg)] text-[var(--crm-text)]">
      <div className="flex h-full w-full">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
          onClose={() => setIsSidebarCollapsed(true)}
          navItems={navItems}
          standaloneNavItems={standaloneNavItems}
          activeNavGroups={activeNavGroups}
          openGroups={openGroups}
          toggleGroup={toggleGroup}
          displayName={displayName}
          primaryRoleDisplay={primaryRoleDisplay}
          onLogout={handleLogout}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
                >
                  <img src={MenuIcon} alt="Abrir menú" className="h-5 w-5 brightness-0" />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Vista actual</p>
                  <h1 className="truncate text-xl font-black tracking-tight text-slate-950">{pageTitle}</h1>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setIsProfileOpen(false); setIsNotificationsOpen((prev) => !prev); }}
                  className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <BellIcon className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setIsNotificationsOpen(false); setIsProfileOpen((prev) => !prev); }}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-900 text-sm font-bold text-white shadow-sm">
                    {user?.foto_url ? (
                      <img src={getFullImageUrl(user.foto_url)} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <span>{`${user?.nombres?.[0] || ""}${user?.apellido_paterno?.[0] || ""}`.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                    <p className="text-xs text-slate-500">{primaryRoleDisplay}</p>
                  </div>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-4 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="min-h-0"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {isNotificationsOpen && (
        <NotificationsPanel
          panelRef={notificationsRef}
          notifications={notifications}
          unreadCount={unreadCount}
          browserNotificationPermission={browserNotificationPermission}
          pushSubscriptionStatus={pushSubscriptionStatus}
          onMarkAllRead={markAllNotificationsAsRead}
          onNotificationClick={handleNotificationClick}
        />
      )}

      {isProfileOpen && (
        <ProfilePanel
          user={user}
          displayName={displayName}
          primaryRoleDisplay={primaryRoleDisplay}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onClose={() => setIsProfileOpen(false)}
        />
      )}
    </div>
  );
}
