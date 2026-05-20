import {
  getPushPublicKeyApi,
  subscribeToPushApi,
  unsubscribeFromPushApi,
} from "@/modules/notifications/services/notifications.api";

export type PushSubscriptionStatus =
  | "unsupported"
  | "idle"
  | "subscribed"
  | "blocked"
  | "unavailable";

export async function getPushSubscriptionStatus(): Promise<PushSubscriptionStatus> {
  if (!supportsPushNotifications()) {
    return "unsupported";
  }

  if (window.Notification.permission === "denied") {
    return "blocked";
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? "subscribed" : "idle";
}

export async function subscribeToPushNotifications(): Promise<PushSubscriptionStatus> {
  if (!supportsPushNotifications()) {
    return "unsupported";
  }

  if (window.Notification.permission === "denied") {
    return "blocked";
  }

  const { publicKey, enabled } = await getPushPublicKeyApi();
  if (!enabled || !publicKey) {
    return "unavailable";
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("No pudimos preparar la suscripcion push del navegador.");
  }

  await subscribeToPushApi({
    endpoint: json.endpoint,
    expirationTime:
      json.expirationTime === null || json.expirationTime === undefined
        ? null
        : String(json.expirationTime),
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
  });

  return "subscribed";
}

export async function disconnectPushNotifications() {
  if (!supportsPushNotifications()) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return;
  }

  await unsubscribeFromPushApi(subscription.endpoint);
  await subscription.unsubscribe();
}

function supportsPushNotifications() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
