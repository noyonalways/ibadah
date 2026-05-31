/* Ibadah service worker
 *
 * Strategies:
 *   • Precache: offline shell + brand icons.
 *   • Navigation (HTML): network-first → runtime cache → /offline.html.
 *   • /_next/static/*  : cache-first (immutable, content-hashed).
 *   • /_next/image     : stale-while-revalidate (image optimizer output).
 *   • Fonts            : cache-first (long-lived).
 *   • Images           : stale-while-revalidate (with size cap).
 *   • Other same-origin GETs: stale-while-revalidate.
 *   • Cross-origin requests (e.g. the user-authenticated backend API):
 *     never intercepted — they remain pure network with credentials,
 *     so we don't risk caching per-user authenticated data.
 *   • All non-GET requests (mutations) are passed through unmodified.
 *
 * Bump VERSION below when ship-blocking changes are made; old caches
 * are pruned during activation, and waiting workers can be force-
 * activated by the page sending { type: 'SKIP_WAITING' }.
 */

const VERSION = 'v1.1.0';

const PRECACHE = `ibadah-precache-${VERSION}`;
const RUNTIME_PAGES = `ibadah-pages-${VERSION}`;
const RUNTIME_STATIC = `ibadah-static-${VERSION}`;
const RUNTIME_IMAGES = `ibadah-images-${VERSION}`;
const RUNTIME_FONTS = `ibadah-fonts-${VERSION}`;

const ALL_CACHES = new Set([
  PRECACHE,
  RUNTIME_PAGES,
  RUNTIME_STATIC,
  RUNTIME_IMAGES,
  RUNTIME_FONTS,
]);

const PRECACHE_URLS = [
  '/offline.html',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable-512.svg',
  '/icon.svg',
];

const MAX_PAGE_ENTRIES = 60;
const MAX_IMAGE_ENTRIES = 80;
const MAX_STATIC_ENTRIES = 80;

/* ----------------------------- Lifecycle ------------------------------ */

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // Use individual put() calls so a single 404 doesn't fail the whole
      // install (e.g. /icon.svg might 404 in dev if Next hasn't generated
      // it yet).
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'reload' });
            if (res.ok) await cache.put(url, res);
          } catch {
            /* tolerate transient pre-cache failures */
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from previous versions.
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => (ALL_CACHES.has(key) ? null : caches.delete(key))),
      );

      // Enable navigation preload to speed up first navigation after the
      // SW takes control. Falls back gracefully if unsupported.
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch {
          /* ignored */
        }
      }

      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ------------------------------- Fetch -------------------------------- */

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never intercept non-GET. Mutations + auth flows must hit the network.
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Cross-origin (e.g. backend API at NEXT_PUBLIC_API_URL). Let the
  // network handle it — we don't want to cache per-user data here.
  if (url.origin !== self.location.origin) return;

  // Skip auth callbacks, telemetry, and Next data routes that should
  // always be fresh.
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests (top-level documents).
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  // Next.js static chunks — content-hashed, safe to cache forever.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, RUNTIME_STATIC));
    return;
  }

  // Next.js image optimizer.
  if (url.pathname.startsWith('/_next/image')) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_IMAGES, MAX_IMAGE_ENTRIES));
    return;
  }

  // Fonts (Google fonts are cross-origin so they're skipped above; this
  // catches self-hosted fonts in /public).
  if (
    request.destination === 'font' ||
    /\.(woff2?|ttf|otf|eot)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, RUNTIME_FONTS));
    return;
  }

  // Images.
  if (
    request.destination === 'image' ||
    /\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_IMAGES, MAX_IMAGE_ENTRIES));
    return;
  }

  // Anything else same-origin: stale-while-revalidate, capped.
  event.respondWith(staleWhileRevalidate(request, RUNTIME_STATIC, MAX_STATIC_ENTRIES));
});

/* ----------------------------- Strategies ----------------------------- */

async function handleNavigation(event) {
  const request = event.request;
  const cache = await caches.open(RUNTIME_PAGES);

  try {
    // Use navigation preload response if available (Chrome).
    const preload = await event.preloadResponse;
    const network = preload || (await fetch(request));

    if (network && network.ok && shouldCacheResponse(network)) {
      cache.put(request, network.clone()).catch(() => {});
      trimCache(RUNTIME_PAGES, MAX_PAGE_ENTRIES);
    }
    return network;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const offline = await caches.match('/offline.html');
    return (
      offline ||
      new Response('You are offline', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain' },
      })
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const network = await fetch(request);
    if (network.ok && shouldCacheResponse(network)) {
      cache.put(request, network.clone()).catch(() => {});
    }
    return network;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((res) => {
      if (res && res.ok && shouldCacheResponse(res)) {
        cache.put(request, res.clone()).catch(() => {});
        if (max) trimCache(cacheName, max);
      }
      return res;
    })
    .catch(() => null);

  // Return cached immediately when present; otherwise wait for network.
  return cached || (await networkPromise) || fetch(request);
}

/* ------------------------------ Helpers ------------------------------- */

/**
 * Avoid caching opaque responses (no-cors) and partial content.
 * 'opaque' responses can lie about size and pollute storage.
 */
function shouldCacheResponse(response) {
  if (!response) return false;
  if (response.status === 206) return false;
  if (response.type === 'opaque') return false;
  return true;
}

/**
 * Bound runtime caches with a simple LRU-ish trim. Keeps storage usage
 * predictable across long sessions and devices with tight quotas.
 */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const surplus = keys.length - maxEntries;
  await Promise.all(keys.slice(0, surplus).map((req) => cache.delete(req)));
}
