import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
import {
  getAvailableModules,
  MODULE_LABELS,
  MODULE_PATHS,
} from "@/shared/auth/navigation.util";
import type { ModuleKey } from "@/shared/auth/interfaces/rbac.interface";
import type { AppNotification } from "@/interfaces/notification.interface";
import dashboardIcon from "@/assets/images/Dashboard.png";
import propiedadesIcon from "@/assets/images/Propiedades.png";
import desarrollosIcon from "@/assets/images/edificios.png";
import registrosIcon from "@/assets/images/Registro.png";
import contenidoIcon from "@/assets/images/Contenido.png";
import materialIcon from "@/assets/images/creador-de-contenido.png";
import usuariosIcon from "@/assets/images/Usuarios.png";
import rolIcon from "@/assets/images/Rol.png";
import logsIcon from "@/assets/images/Logs.png";
import MenuIcon from "@/assets/images/Menu.png";
import LogoutIcon from "@/assets/images/Logout.png";
import logoBlanco from "@/assets/images/logo_blanco.png";

const MODULE_ICONS: Record<ModuleKey, string> = {
  dashboard: dashboardIcon,
  Estadísticas: dashboardIcon,
  propiedades: propiedadesIcon,
  desarrollos: desarrollosIcon,
  material: materialIcon,
  registros: registrosIcon,
  registros_leads: registrosIcon,
  solicitudes_leads: registrosIcon,
  blogs: contenidoIcon,
  usuarios: usuariosIcon,
  roles: rolIcon,
  movimientos: logsIcon,
  Operaciones: logsIcon,
  Comisiones: logsIcon,
  CarteraClientes: usuariosIcon,
};

type NavGroupConfig = {
  label: string;
  icon: string;
  modules: ModuleKey[];
};

const NAV_GROUP_CONFIGS: NavGroupConfig[] = [
  {
    label: "Clientes",
    icon: registrosIcon,
    modules: ["registros", "registros_leads", "solicitudes_leads"],
  },
  {
    label: "Contenido",
    icon: contenidoIcon,
    modules: ["blogs", "material"],
  },
  {
    label: "Administración",
    icon: usuariosIcon,
    modules: ["usuarios", "roles", "movimientos"],
  },
];

const STANDALONE_MODULES = new Set<ModuleKey>(["dashboard", "Estadísticas", "propiedades", "desarrollos", "Operaciones", "CarteraClientes"]);

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
    useState<BrowserNotificationPermissionState>(() =>
      getBrowserNotificationPermission(),
    );
  const [pushSubscriptionStatus, setPushSubscriptionStatus] =
    useState<PushSubscriptionStatus>("idle");
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const hasBootstrappedNotifications = useRef(false);
  const notifiedIdsRef = useRef<Set<number>>(new Set());

  const permissions = user?.permisos ?? [];
  const availableModules = getAvailableModules(permissions, user?.roles ?? []);
  const isDark = theme === "dark";

  const navItems: Array<{ to: string; label: string; icon: string }> =
    availableModules.map((module: ModuleKey) => ({
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

  const primaryRoleDisplay = user ? getHighestPriorityRoleLabel(user) : "Sin rol asignado";
  const pageTitle = getPageTitle(location.pathname);
  const displayName = user
    ? `${user.nombres || ""} ${user.apellido_paterno || ""}`.trim() ||
      user.correo_electronico
    : "Usuario";

  useEffect(() => {
    setBrowserNotificationPermission(getBrowserNotificationPermission());
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setPushSubscriptionStatus("idle");
      return;
    }

    let isCancelled = false;

    const syncPushStatus = async () => {
      try {
        const status = await getPushSubscriptionStatus();
        if (isCancelled) return;

        setPushSubscriptionStatus(status);

        if (status === "subscribed") {
          await subscribeToPushNotifications();
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("No pudimos sincronizar el estado de push.", error);
        }
      }
    };

    void syncPushStatus();

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      resetNotifications();
      hasBootstrappedNotifications.current = false;
      notifiedIdsRef.current = new Set();
      return;
    }

    let isCancelled = false;

    const syncNotifications = async () => {
      try {
        const items = await refreshNotifications();
        if (isCancelled) return;

        const nextUnreadIds = new Set(
          items.filter((item) => !item.leida_en).map((item) => item.id),
        );

        if (hasBootstrappedNotifications.current) {
          const newUnreadNotifications = items
            .filter(
              (item) =>
                !item.leida_en && !notifiedIdsRef.current.has(item.id),
            )
            .slice(0, 3);

          newUnreadNotifications.forEach((item) => {
            toast(item.titulo ? `${item.titulo}: ${item.mensaje}` : item.mensaje, {
              duration: 5000,
            });

            showBrowserNotification(item, () => {
              void handleNotificationClick(item);
            });
          });
        }

        notifiedIdsRef.current = nextUnreadIds;
        hasBootstrappedNotifications.current = true;
      } catch (error) {
        if (!isCancelled && !hasLoadedNotifications) {
          console.error("No pudimos cargar las notificaciones.", error);
        }
      }
    };

    void syncNotifications();
    const intervalId = window.setInterval(() => {
      void syncNotifications();
    }, 60000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    hasLoadedNotifications,
    pushSubscriptionStatus,
    refreshNotifications,
    resetNotifications,
    user?.id,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const current = NAV_GROUP_CONFIGS.find((g) =>
      g.modules.some((m) => location.pathname.startsWith(MODULE_PATHS[m]))
    );
    if (current) {
      setOpenGroups((prev) => new Set([...prev, current.label]));
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }

    let isCancelled = false;

    const enableBrowserNotifications = async () => {
      let permission = browserNotificationPermission;

      if (permission === "default") {
        permission = await requestBrowserNotificationPermission();
        if (!isCancelled) {
          setBrowserNotificationPermission(permission);
        }
      }

      if (permission !== "granted" || isCancelled) {
        return;
      }

      try {
        const status = await subscribeToPushNotifications();
        if (!isCancelled) {
          setPushSubscriptionStatus(status);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("No pudimos activar las notificaciones push.", error);
          setPushSubscriptionStatus("unavailable");
          toast.error("No pudimos activar las notificaciones externas.");
        }
      }
    };

    void enableBrowserNotifications();

    return () => {
      isCancelled = true;
    };
  }, [browserNotificationPermission, isNotificationsOpen]);

  const handleLogout = () => {
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
    performLogout();
    navigate("/login", { replace: true });

    void disconnectPushNotifications().catch((error) => {
      console.error("No pudimos desactivar las notificaciones push al salir.", error);
    });
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.leida_en) {
      await markNotificationAsRead(notification.id);
    }

    setIsNotificationsOpen(false);

    if (notification.modulo === "registros") {
      navigate(MODULE_PATHS.registros);
      return;
    }

    if (notification.modulo === "registros_leads") {
      navigate(MODULE_PATHS.registros_leads);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[var(--crm-bg)] text-[var(--crm-text)]">
      <div className="flex h-full w-full">
        {!isSidebarCollapsed && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/45 md:hidden"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800/80 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] text-slate-100 transition-all duration-300 md:relative",
            isSidebarCollapsed
              ? "-translate-x-full md:translate-x-0 md:w-[92px] md:px-3 md:py-5"
              : "w-[282px] translate-x-0 px-4 py-5 md:w-[264px] md:px-5 md:py-6",
          ].join(" ")}
        >
          <div
            className={
              isSidebarCollapsed ? "flex justify-center" : "flex justify-between"
            }
          >
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3">
                <img
                  src={logoBlanco}
                  alt="Logo Tamivar"
                  className="h-11 w-auto shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    CRM TAMIVAR
                  </p>
                  <h2 className="truncate text-lg font-bold tracking-tight text-white">
                    Panel
                  </h2>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-white/5 text-slate-200 transition hover:bg-white/10"
            >
              <img src={MenuIcon} alt="Menu" className="h-5 w-5 shrink-0" />
            </button>
          </div>

          <nav className="crm-scrollbar-hidden mt-8 flex flex-1 flex-col gap-2 overflow-y-auto">
            {isSidebarCollapsed ? (
              navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => window.innerWidth < 768 && setIsSidebarCollapsed(true)}
                  className={({ isActive }) =>
                    [
                      "group flex items-center justify-center rounded-2xl px-2 py-3.5 text-sm transition-all duration-200",
                      isActive
                        ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                        : "text-slate-300 hover:bg-white/5 hover:text-white",
                    ].join(" ")
                  }
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/6 transition group-hover:bg-white/10">
                    <img src={item.icon} alt="" className="h-5 w-5 shrink-0" />
                  </span>
                </NavLink>
              ))
            ) : (
              <>
                {standaloneNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => window.innerWidth < 768 && setIsSidebarCollapsed(true)}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-all duration-200",
                        isActive
                          ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                          : "text-slate-300 hover:bg-white/5 hover:text-white",
                      ].join(" ")
                    }
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/6 transition group-hover:bg-white/10">
                      <img src={item.icon} alt="" className="h-5 w-5 shrink-0" />
                    </span>
                    <span className="truncate font-medium">{item.label}</span>
                  </NavLink>
                ))}

                {activeNavGroups.map((group) => {
                  const isOpen = openGroups.has(group.label);
                  const isGroupActive = group.items.some((item) =>
                    location.pathname.startsWith(item.to)
                  );

                  return (
                    <div key={group.label}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.label)}
                        className={[
                          "group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-all duration-200",
                          isGroupActive
                            ? "text-white"
                            : "text-slate-400 hover:bg-white/5 hover:text-white",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/6 transition group-hover:bg-white/10",
                            isGroupActive ? "bg-white/10" : "bg-white/5",
                          ].join(" ")}
                        >
                          <img src={group.icon} alt="" className="h-5 w-5 shrink-0" />
                        </span>
                        <span className="flex-1 truncate text-left font-medium">
                          {group.label}
                        </span>
                        <ChevronDownIcon
                          className={[
                            "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
                            isOpen ? "rotate-0" : "-rotate-90",
                          ].join(" ")}
                        />
                      </button>

                      {isOpen && (
                        <div className="ml-5 mt-1 flex flex-col gap-1 border-l border-white/10 pl-3">
                          {group.items.map((item) => (
                            <NavLink
                              key={item.to}
                              to={item.to}
                              onClick={() =>
                                window.innerWidth < 768 && setIsSidebarCollapsed(true)
                              }
                              className={({ isActive }) =>
                                [
                                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                                  isActive
                                    ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                                ].join(" ")
                              }
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-inset ring-white/6 transition group-hover:bg-white/10">
                                <img src={item.icon} alt="" className="h-4 w-4 shrink-0" />
                              </span>
                              <span className="truncate font-medium">{item.label}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </nav>

          <div className="mt-auto space-y-4 pt-4">
            {!isSidebarCollapsed && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="truncate text-sm font-semibold text-white">
                  {displayName}
                </p>
                <p className="mt-1 text-xs text-slate-400">{primaryRoleDisplay}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleLogout()}
              className={[
                "inline-flex w-full items-center justify-center rounded-2xl border border-red-500/60 bg-red-600 font-semibold text-white shadow-sm transition hover:bg-red-700",
                isSidebarCollapsed
                  ? "h-11 px-2 py-3"
                  : "gap-2 px-3 py-3 text-sm",
              ].join(" ")}
            >
              <img src={LogoutIcon} alt="Logout" className="h-5 w-5 shrink-0" />
              {!isSidebarCollapsed && <span>Cerrar sesión</span>}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
                >
                  <img
                    src={MenuIcon}
                    alt="Abrir menú"
                    className="h-5 w-5 brightness-0"
                  />
                </button>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Vista actual
                  </p>
                  <h1 className="truncate text-xl font-black tracking-tight text-slate-950">
                    {pageTitle}
                  </h1>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsNotificationsOpen((prev) => !prev);
                    }}
                    className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <BellIcon className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute right-2 top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      setIsProfileOpen((prev) => !prev);
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-900 text-sm font-bold text-white shadow-sm">
                      {user?.foto_url ? (
                        <img
                          src={getFullImageUrl(user.foto_url)}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>
                          {`${user?.nombres?.[0] || ""}${user?.apellido_paterno?.[0] || ""}`.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-semibold text-slate-900">
                        {displayName}
                      </p>
                      <p className="text-xs text-slate-500">{primaryRoleDisplay}</p>
                    </div>
                  </button>

                </div>
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
        <div
          className="pointer-events-none fixed inset-0 z-[92]"
        >
          <div
            ref={notificationsRef}
            className="pointer-events-auto absolute right-4 top-20 z-[93] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.22)] md:right-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Notificaciones
                </p>
                <p className="text-xs text-slate-500">
                  {unreadCount > 0
                    ? `${unreadCount} pendiente${unreadCount === 1 ? "" : "s"}`
                    : "No tienes pendientes"}
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllNotificationsAsRead()}
                  className="text-xs font-semibold text-sky-700 transition hover:text-sky-800"
                >
                  Marcar todas
                </button>
              )}
            </div>

            {browserNotificationPermission !== "unsupported" && (
              <div className="border-b border-slate-100 bg-sky-50/70 px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                      Notificaciones externas
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {pushSubscriptionStatus === "subscribed" &&
                        "Las notificaciones push ya están activas, incluso si cierras la ventana del CRM."}
                      {pushSubscriptionStatus === "unavailable" &&
                        "El servicio push no esta disponible todavía en este entorno local."}
                      {browserNotificationPermission === "default" &&
                        "Activa los avisos del navegador para recibir recordatorios fuera de la ventana del CRM."}
                      {browserNotificationPermission === "denied" &&
                        "El navegador tiene bloqueados los avisos. Si los quieres usar, habilitados desde la configuración del sitio."}
                      {browserNotificationPermission === "granted" &&
                        pushSubscriptionStatus === "idle" &&
                        "Tu navegador ya dio permiso. Enseguida intentamos registrar el canal push."}
                    </p>
                  </div>

                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                      getPushStatusBadgeClass(
                        browserNotificationPermission,
                        pushSubscriptionStatus,
                      ),
                    ].join(" ")}
                  >
                    {getPushStatusLabel(
                      browserNotificationPermission,
                      pushSubscriptionStatus,
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="crm-scrollbar-hidden max-h-[min(70vh,420px)] overflow-y-auto px-3 py-3">
              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No hay notificaciones por ahora.
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => void handleNotificationClick(notification)}
                      className={[
                        "w-full rounded-2xl border px-4 py-3 text-left transition",
                        notification.leida_en
                          ? "border-slate-200 bg-white hover:bg-slate-50"
                          : "border-sky-100 bg-sky-50/70 hover:bg-sky-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div
                            className={[
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-base font-semibold",
                              getNotificationIconClass(notification),
                            ].join(" ")}
                            aria-hidden="true"
                          >
                            {getNotificationIcon(notification)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {notification.titulo}
                              </p>
                              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                {getNotificationTypeLabel(notification)}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-slate-600">
                              {notification.mensaje}
                            </p>
                          </div>
                        </div>

                        {!notification.leida_en && (
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span>{getNotificationModuleLabel(notification.modulo)}</span>
                          <span className="text-slate-300">•</span>
                          <span>{getNotificationMomentLabel(notification)}</span>
                        </div>
                        <span className="font-semibold text-sky-700">
                          {getNotificationActionLabel(notification)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isProfileOpen && (
        <div
          className="fixed inset-0 z-[90] bg-slate-950/35 backdrop-blur-[2px]"
          onClick={() => setIsProfileOpen(false)}
        >
          <div
            className={`absolute right-4 top-20 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border shadow-[0_32px_80px_rgba(15,23,42,0.32)] md:right-8 ${
              isDark
                ? "border-slate-700 bg-[linear-gradient(180deg,#0F172A_0%,#111827_100%)] text-slate-100"
                : "border-slate-200 bg-white text-slate-900"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`px-5 pb-5 pt-4 ${
                isDark
                  ? "bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.22),transparent_38%),linear-gradient(180deg,#0F172A_0%,#111827_100%)]"
                  : "bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_38%),linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Perfil rápido
                  </p>
                  <h3 className={`mt-2 text-xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-950"}`}>
                    {displayName}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-lg transition ${
                    isDark
                      ? "border-slate-700 bg-white/5 text-slate-200 hover:bg-white/10"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                  aria-label="Cerrar perfil"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] text-xl font-bold ${
                  isDark
                    ? "bg-white/10 text-white ring-1 ring-inset ring-white/10"
                    : "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200"
                }`}>
                  {user?.foto_url ? (
                    <img
                      src={getFullImageUrl(user.foto_url)}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {`${user?.nombres?.[0] || ""}${user?.apellido_paterno?.[0] || ""}`.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      isDark
                        ? "bg-sky-500/12 text-sky-200 ring-1 ring-inset ring-sky-400/20"
                        : "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200"
                    }`}>
                      {primaryRoleDisplay}
                    </span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      user?.activo === false
                        ? isDark
                          ? "bg-rose-500/12 text-rose-200 ring-1 ring-inset ring-rose-400/20"
                          : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
                        : isDark
                          ? "bg-emerald-500/12 text-emerald-200 ring-1 ring-inset ring-emerald-400/20"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                    }`}>
                      {user?.activo === false ? "Inactivo" : "Activo"}
                    </span>
                  </div>

                  {user?.codigo_usuario && (
                    <p className={`mt-3 text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                      ID {user.codigo_usuario}
                    </p>
                  )}
                  <p className={`mt-1 text-sm ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                    {user?.correo_electronico || "Sin correo"}
                  </p>
                </div>
              </div>
            </div>

            <div className={`px-5 py-5 ${isDark ? "bg-slate-950/25" : "bg-white"}`}>
            <div className={`overflow-hidden rounded-[24px] border ${
                isDark ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-slate-50"
              }`}>
                <ProfileInfoRow label="Teléfono" value={formatPhoneValue(user?.telefono)} isDark={isDark} />
                <ProfileInfoRow label="Apellido paterno" value={user?.apellido_paterno || "Sin dato"} isDark={isDark} />
                <ProfileInfoRow label="Apellido materno" value={user?.apellido_materno || "Sin dato"} isDark={isDark} />
                <ProfileInfoRow label="Folio de certificación" value={user?.folio_certificacion || "Sin dato"} isDark={isDark} />
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`inline-flex w-full items-center justify-between rounded-[22px] border px-4 py-3.5 text-left transition ${
                    isDark
                      ? "border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-900"
                      : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100"
                  }`}
                  aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                >
                  <span className="flex items-center gap-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                      isDark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200"
                    }`}>
                      {isDark ? (
                        <SunIcon className="h-4.5 w-4.5" />
                      ) : (
                        <MoonIcon className="h-4.5 w-4.5" />
                      )}
                    </span>
                    <span>
                      <span className={`block text-[11px] font-semibold uppercase tracking-[0.16em] ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}>
                        Apariencia
                      </span>
                      <span className="mt-1 block text-sm font-semibold">
                        {isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                      </span>
                    </span>
                  </span>

                  <span className={`text-xs font-semibold ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}>
                    {isDark ? "Claro" : "Oscuro"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M10 17a2 2 0 0 0 4 0" />
    </svg>
  );
}

function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="M4.93 4.93l1.77 1.77" />
      <path d="M17.3 17.3l1.77 1.77" />
      <path d="M2 12h2.5" />
      <path d="M19.5 12H22" />
      <path d="M4.93 19.07l1.77-1.77" />
      <path d="M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

function MoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function ProfileInfoRow({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 px-4 py-3.5 ${
      isDark ? "border-b border-slate-800 last:border-b-0" : "border-b border-slate-200 last:border-b-0"
    }`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
        isDark ? "text-slate-400" : "text-slate-500"
      }`}>
        {label}
      </p>
      <p className={`max-w-[62%] break-words text-right text-sm font-medium leading-6 ${
        isDark ? "text-slate-200" : "text-slate-800"
      }`}>
        {value}
      </p>
    </div>
  );
}

function formatPhoneValue(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "Sin teléfono";
  }

  return String(value);
}

function getPushStatusLabel(
  permission: BrowserNotificationPermissionState,
  status: PushSubscriptionStatus,
) {
  if (status === "subscribed") return "Activo";
  if (permission === "denied") return "Bloqueado";
  if (status === "unavailable") return "No disponible";
  if (permission === "granted") return "Conectando";
  return "Pendiente";
}

function getPushStatusBadgeClass(
  permission: BrowserNotificationPermissionState,
  status: PushSubscriptionStatus,
) {
  if (status === "subscribed") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (permission === "denied") {
    return "bg-rose-100 text-rose-700";
  }

  if (status === "unavailable") {
    return "bg-slate-200 text-slate-600";
  }

  if (permission === "granted") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-sky-100 text-sky-700";
}

function getNotificationIcon(notification: AppNotification) {
  if (notification.tipo === "lead_asignado") return "L";
  if (notification.tipo === "recordatorio_cita_24h") return "24";
  if (notification.tipo === "recordatorio_cita_5h") return "5";
  return "N";
}

function getNotificationIconClass(notification: AppNotification) {
  if (notification.tipo === "lead_asignado") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (notification.tipo === "recordatorio_cita_24h") {
    return "bg-sky-100 text-sky-700";
  }

  if (notification.tipo === "recordatorio_cita_5h") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-700";
}

function getNotificationTypeLabel(notification: AppNotification) {
  if (notification.tipo === "lead_asignado") return "Lead";
  if (notification.tipo === "recordatorio_cita_24h") return "24h";
  if (notification.tipo === "recordatorio_cita_5h") return "5h";
  return "General";
}

function getNotificationActionLabel(notification: AppNotification) {
  if (notification.modulo === "registros_leads") return "Abrir lead";
  if (notification.modulo === "registros") return "Abrir visita";
  return "Abrir";
}

function getNotificationModuleLabel(module: string) {
  if (module === "registros_leads") return "Registros leads";
  if (module === "registros") return "Registros visitas";
  return module;
}

function getNotificationMomentLabel(notification: AppNotification) {
  const referenceDate = notification.programada_para ?? notification.creada_en;
  if (!referenceDate) {
    return "";
  }

  if (notification.tipo.startsWith("recordatorio_cita_")) {
    return `Programada para ${formatNotificationDate(referenceDate)}`;
  }

  return formatNotificationDate(referenceDate);
}

function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";

  if (pathname.startsWith("/modulos/registros-visitas")) {
    return MODULE_LABELS.registros;
  }

  if (pathname.startsWith("/modulos/registros-leads")) {
    return MODULE_LABELS.registros_leads;
  }

  if (pathname.startsWith("/modulos/solicitudes-leads")) {
    return MODULE_LABELS.solicitudes_leads;
  }

  if (pathname.startsWith("/modulos/")) {
    const rawModule = pathname
      .replace("/modulos/", "")
      .split("/")[0] as ModuleKey;
    return MODULE_LABELS[rawModule] ?? "Módulo";
  }

  return "Dashboard";
}
