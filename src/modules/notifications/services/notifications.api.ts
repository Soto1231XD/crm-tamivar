import { apiRequest } from "@/shared/apiRequest";
import type {
  AppNotification,
  NotificationCountResponse,
  PushPublicKeyResponse,
  PushSubscriptionPayload,
} from "@/interfaces/notification.interface";

export function listNotificationsApi(includeRead = false) {
  return apiRequest<AppNotification[]>("/notificaciones", {
    params: includeRead ? { includeRead: true } : undefined,
  });
}

export function getUnreadNotificationsCountApi() {
  return apiRequest<NotificationCountResponse>("/notificaciones/unread-count");
}

export function markNotificationAsReadApi(id: number) {
  return apiRequest<AppNotification>(`/notificaciones/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsAsReadApi() {
  return apiRequest<{ updated: number }>("/notificaciones/read-all", {
    method: "PATCH",
  });
}

export function getPushPublicKeyApi() {
  return apiRequest<PushPublicKeyResponse>("/notificaciones/push/public-key");
}

export function subscribeToPushApi(subscription: PushSubscriptionPayload) {
  return apiRequest("/notificaciones/push/subscribe", {
    method: "POST",
    data: subscription,
  });
}

export function unsubscribeFromPushApi(endpoint: string) {
  return apiRequest("/notificaciones/push/unsubscribe", {
    method: "POST",
    data: { endpoint },
  });
}
