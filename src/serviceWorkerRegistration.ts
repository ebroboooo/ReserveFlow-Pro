const TOAST_ID = 'rfp-update-toast';
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

let refreshing = false;
let updateToastVisible = false;

function onControllerChange() {
  if (refreshing) return;
  refreshing = true;
  window.location.reload();
}

function hideUpdateToast() {
  document.getElementById(TOAST_ID)?.remove();
  updateToastVisible = false;
}

function showUpdateToast(onRefresh: () => void) {
  if (updateToastVisible || document.getElementById(TOAST_ID)) return;
  updateToastVisible = true;

  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.className =
    'fixed bottom-6 right-6 z-[9999] max-w-sm panel border border-slate-200 shadow-2xl rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const message = document.createElement('p');
  message.className = 'text-sm text-slate-800 font-medium leading-snug mb-3';
  message.textContent = 'A new version is available. Refresh to update.';

  const refreshButton = document.createElement('button');
  refreshButton.type = 'button';
  refreshButton.className = 'btn-primary w-full py-2.5 text-xs font-semibold';
  refreshButton.textContent = 'Refresh';
  refreshButton.addEventListener('click', () => {
    refreshButton.disabled = true;
    refreshButton.textContent = 'Updating...';
    onRefresh();
  });

  toast.append(message, refreshButton);
  document.body.appendChild(toast);
}

function promptForWaitingWorker(registration: ServiceWorkerRegistration) {
  if (!registration.waiting || !navigator.serviceWorker.controller) return;

  showUpdateToast(() => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
  });
}

function trackInstallingWorker(registration: ServiceWorkerRegistration) {
  const newWorker = registration.installing;
  if (!newWorker) return;

  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed') {
      promptForWaitingWorker(registration);
    }
  });
}

function scheduleUpdateChecks(registration: ServiceWorkerRegistration) {
  const checkForUpdates = () => {
    registration.update().catch(() => {
      // Ignore transient update check failures.
    });
  };

  window.addEventListener('focus', checkForUpdates);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkForUpdates();
  });
  window.setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);
}

export function register() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

  window.addEventListener('load', () => {
    const swUrl = '/service-worker.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        promptForWaitingWorker(registration);

        registration.addEventListener('updatefound', () => {
          trackInstallingWorker(registration);
        });

        scheduleUpdateChecks(registration);
      })
      .catch((error) => {
        console.error('SmileCare Pro: Service Worker registration failed.', error);
      });
  });
}

export function unregister() {
  hideUpdateToast();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
