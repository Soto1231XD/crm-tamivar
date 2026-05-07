import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { AppProviders } from './app/providers/AppProviders';
import { registerSW } from 'virtual:pwa-register';
import './styles/globals.css';

const BUILD_STORAGE_KEY = 'crm-tamivar-build';
const BUILD_RESET_PREFIX = 'crm-tamivar-build-reset';

async function clearPwaCaches() {
  if (!('caches' in window)) return;

  const cacheKeys = await caches.keys();
  await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
}

async function synchronizeBuildCache() {
  const currentBuild = __APP_BUILD__;
  const previousBuild = localStorage.getItem(BUILD_STORAGE_KEY);
  const resetFlag = `${BUILD_RESET_PREFIX}:${currentBuild}`;

  if (
    previousBuild &&
    previousBuild !== currentBuild &&
    sessionStorage.getItem(resetFlag) !== 'done'
  ) {
    sessionStorage.setItem(resetFlag, 'done');
    await clearPwaCaches();
    localStorage.setItem(BUILD_STORAGE_KEY, currentBuild);
    window.location.reload();
    return true;
  }

  localStorage.setItem(BUILD_STORAGE_KEY, currentBuild);
  return false;
}

let isRefreshingForUpdate = false;

async function refreshApplication(
  updateSW?: (reloadPage?: boolean) => Promise<void>,
) {
  if (isRefreshingForUpdate) return;
  isRefreshingForUpdate = true;

  try {
    await clearPwaCaches();

    if (updateSW) {
      await updateSW(true);
      return;
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.update()));
    }
  } finally {
    window.location.reload();
  }
}

let updateServiceWorker: ReturnType<typeof registerSW> | undefined;

updateServiceWorker = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    window.setInterval(() => {
      void registration.update();
    }, 60_000);
  },
  onNeedRefresh() {
    void refreshApplication(updateServiceWorker);
  },
});

void synchronizeBuildCache();

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
