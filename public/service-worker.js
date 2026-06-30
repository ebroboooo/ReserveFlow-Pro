/* SmileCare Pro PWA service worker — build: __BUILD_ID__ */
const BUILD_ID = '__BUILD_ID__';
const STATIC_CACHE = `smilecare-static-${BUILD_ID}`;

const IMMUTABLE_ASSET_PATTERN = /\/assets\/.+\.(?:js|css|woff2?|ttf|eot|svg|png|jpe?g|gif|webp|ico)$/i;
const PUBLIC_STATIC_PATTERN = /^\/(?:favicon\.(?:ico|svg)|manifest\.json|icons(?:\/|$)|icons\.svg|robots\.txt)$/;

self.addEventListener('install', (event) => {
  // Do not precache index.html or skipWaiting automatically.
  // The page prompts the user before activating a waiting worker.
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept the service worker script itself.
  if (url.pathname === '/service-worker.js') return;

  if (isDocumentRequest(request)) {
    event.respondWith(networkFirstDocument(request));
    return;
  }

  if (IMMUTABLE_ASSET_PATTERN.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (PUBLIC_STATIC_PATTERN.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

function isDocumentRequest(request) {
  return (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.headers.get('accept')?.includes('text/html')
  );
}

async function networkFirstDocument(request) {
  try {
    return await fetch(request, { cache: 'no-store' });
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const networkFetch = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || networkFetch;
}
