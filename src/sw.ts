/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{
    url: string;
    revision: string | null;
  }>;
};

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html"), {
  allowlist: [/^\/$/],
}));

self.addEventListener("push", (event) => {
  const payload = event.data?.json() as
    | {
        title?: string;
        body?: string;
        url?: string;
        notificationId?: number;
      }
    | undefined;

  const title = payload?.title || "CRM Tamivar";
  const body = payload?.body || "Tienes una nueva notificacion.";
  const url = payload?.url || "/dashboard";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: {
        url,
        notificationId: payload?.notificationId,
      },
      badge: "/logo_pwa.png",
      icon: "/logo_pwa.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = String(event.notification.data?.url || "/dashboard");

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      return self.clients.openWindow(targetUrl);
    }),
  );
});
