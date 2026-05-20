import type { AppNotification } from "@/interfaces/notification.interface";

export type BrowserNotificationPermissionState =
  | NotificationPermission
  | "unsupported";

export function supportsBrowserNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): BrowserNotificationPermissionState {
  if (!supportsBrowserNotifications()) {
    return "unsupported";
  }

  return window.Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermissionState> {
  if (!supportsBrowserNotifications()) {
    return "unsupported";
  }

  return window.Notification.requestPermission();
}

export function showBrowserNotification(
  notification: AppNotification,
  onClick?: () => void,
): Notification | null {
  if (getBrowserNotificationPermission() !== "granted") {
    return null;
  }

  const systemNotification = new window.Notification(
    notification.titulo || "Nueva notificacion",
    {
      body: notification.mensaje,
      tag: `crm-tamivar-notification-${notification.id}`,
    },
  );

  if (onClick) {
    systemNotification.onclick = () => {
      window.focus();
      onClick();
      systemNotification.close();
    };
  }

  return systemNotification;
}
