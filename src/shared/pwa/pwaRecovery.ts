const BUILD_STORAGE_KEY = "crm-tamivar-build";

export async function clearApplicationCaches() {
  if (typeof window === "undefined") return;

  if ("caches" in window) {
    const cacheKeys = await window.caches.keys();
    await Promise.all(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)));
  }
}

export async function unregisterServiceWorkers() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
}

export async function resetPwaApplication() {
  await clearApplicationCaches();
  await unregisterServiceWorkers();

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(BUILD_STORAGE_KEY);
  }
}
