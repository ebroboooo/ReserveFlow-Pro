// Service Worker Registration for PWA caching support

export function register() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      const swUrl = '/service-worker.js';
      navigator.serviceWorker.register(swUrl)
        .then(() => {
          // Service worker registered successfully
        })
        .catch((err) => {
          console.error('ReserveFlow Pro: Service Worker registration failed.', err);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
