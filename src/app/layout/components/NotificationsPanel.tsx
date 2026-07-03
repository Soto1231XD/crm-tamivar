import type { RefObject } from "react";
import type { AppNotification } from "@/interfaces/notification.interface";
import type { BrowserNotificationPermissionState } from "@/modules/notifications/utils/browserNotifications";
import type { PushSubscriptionStatus } from "@/modules/notifications/utils/pushNotifications";
import {
  getPushStatusLabel,
  getPushStatusBadgeClass,
  getNotificationIcon,
  getNotificationIconClass,
  getNotificationTypeLabel,
  getNotificationActionLabel,
  getNotificationModuleLabel,
  getNotificationMomentLabel,
} from "../notifications.utils";

type NotificationsPanelProps = {
  panelRef: RefObject<HTMLDivElement | null>;
  notifications: AppNotification[];
  unreadCount: number;
  browserNotificationPermission: BrowserNotificationPermissionState;
  pushSubscriptionStatus: PushSubscriptionStatus;
  onMarkAllRead: () => Promise<void>;
  onNotificationClick: (notification: AppNotification) => Promise<void>;
};

export function NotificationsPanel({
  panelRef,
  notifications,
  unreadCount,
  browserNotificationPermission,
  pushSubscriptionStatus,
  onMarkAllRead,
  onNotificationClick,
}: NotificationsPanelProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[92]">
      <div
        ref={panelRef}
        className="pointer-events-auto absolute right-4 top-20 z-[93] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.22)] md:right-8"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
            <p className="text-xs text-slate-500">
              {unreadCount > 0
                ? `${unreadCount} pendiente${unreadCount === 1 ? "" : "s"}`
                : "No tienes pendientes"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void onMarkAllRead()}
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
                  {pushSubscriptionStatus === "subscribed" && "Las notificaciones push ya están activas, incluso si cierras la ventana del CRM."}
                  {pushSubscriptionStatus === "unavailable" && "El servicio push no esta disponible todavía en este entorno local."}
                  {browserNotificationPermission === "default" && "Activa los avisos del navegador para recibir recordatorios fuera de la ventana del CRM."}
                  {browserNotificationPermission === "denied" && "El navegador tiene bloqueados los avisos. Si los quieres usar, habilitados desde la configuración del sitio."}
                  {browserNotificationPermission === "granted" && pushSubscriptionStatus === "idle" && "Tu navegador ya dio permiso. Enseguida intentamos registrar el canal push."}
                </p>
              </div>
              <span className={[
                "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                getPushStatusBadgeClass(browserNotificationPermission, pushSubscriptionStatus),
              ].join(" ")}>
                {getPushStatusLabel(browserNotificationPermission, pushSubscriptionStatus)}
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
                  onClick={() => void onNotificationClick(notification)}
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
                          <p className="text-sm font-semibold text-slate-900">{notification.titulo}</p>
                          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {getNotificationTypeLabel(notification)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{notification.mensaje}</p>
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
  );
}
