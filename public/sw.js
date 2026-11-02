/* DevTools Pro service worker.
 *
 * Caches:
 *   devtools-static-<v>  /_next/static/* (content-hashed, immutable) — cache-first
 *   devtools-pages-<v>   HTML documents for every route — network-first w/ timeout
 *   devtools-assets-<v>  other same-origin GETs (icons, manifest, /_next/image) — stale-while-revalidate
 *
 * <v> comes from public/sw-precache.js, generated per build by
 * scripts/generate-sw-precache.mjs (npm "prebuild"). A new build changes that
 * file, which makes the browser install a new worker; it then WAITS until the
 * page asks it to take over (the "Update available — Reload" prompt), and old
 * caches are dropped on activate.
 *
 * Never cached: non-GET requests (e.g. POST /api/feedback), /api/*, cross-origin
 * requests, and App Router RSC payloads (see handleRsc).
 */

try {
  importScripts('/sw-precache.js');
} catch {
  // Not generated (e.g. `next build` run directly): fall back to discovery below.
}

const PRECACHE = self.__SW_PRECACHE || { version: 'fallback', routes: ['/', '/tools', '/offline'] };
const VERSION = PRECACHE.version;
const STATIC_CACHE = `devtools-static-${VERSION}`;
const PAGES_CACHE = `devtools-pages-${VERSION}`;
const ASSETS_CACHE = `devtools-assets-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, ASSETS_CACHE];
const CACHE_PREFIX = 'devtools-';

const OFFLINE_URL = '/offline';
const NAVIGATION_TIMEOUT_MS = 3500;
const RSC_TIMEOUT_MS = 4000;

const EXTRA_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
];

// ── Helpers ───────────────────────────────────────────────────────────────

/** Cache key for a page: origin + pathname (query strings and hashes ignored). */
function pageKey(url) {
  const u = new URL(url, self.location.origin);
  let path = u.pathname;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return new Request(u.origin + path);
}

function isCacheableResponse(response) {
  return !!response && response.ok && response.type === 'basic';
}

function isHtml(response) {
  return (response.headers.get('content-type') || '').includes('text/html');
}

function fetchWithTimeout(request, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(request, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

/** Extract same-origin /_next/static asset URLs referenced by an HTML document. */
function extractStaticAssets(html) {
  const found = new Set();
  const re = /["'(](\/_next\/static\/[^"'()\s\\]+)/g;
  let m;
  while ((m = re.exec(html))) found.add(m[1]);
  return [...found];
}

/** Fallback when sw-precache.js is missing: discover tool links from /tools. */
function extractRoutes(html) {
  const found = new Set();
  const re = /href="(\/tools(?:\/[a-z0-9-]+){0,2})"/g;
  let m;
  while ((m = re.exec(html))) found.add(m[1]);
  return [...found];
}

async function precacheRoute(route, pagesCache, staticCache, seenAssets) {
  const response = await fetch(route, { cache: 'reload', credentials: 'same-origin' });
  if (!isCacheableResponse(response) || !isHtml(response) || response.redirected) {
    throw new Error(`${route}: ${response.status}`);
  }
  const html = await response.clone().text();
  await pagesCache.put(pageKey(route), response);

  const assets = extractStaticAssets(html).filter((a) => !seenAssets.has(a));
  assets.forEach((a) => seenAssets.add(a));
  await Promise.allSettled(
    assets.map(async (asset) => {
      if (await staticCache.match(asset)) return;
      const res = await fetch(asset);
      if (isCacheableResponse(res)) await staticCache.put(asset, res);
    })
  );
  return html;
}

async function precache() {
  const [pagesCache, staticCache, assetsCache] = await Promise.all([
    caches.open(PAGES_CACHE),
    caches.open(STATIC_CACHE),
    caches.open(ASSETS_CACHE),
  ]);
  const seenAssets = new Set();
  const routes = new Set(PRECACHE.routes);

  // The offline page and the home page are required: fail the install without them
  // so the previous (working) worker stays in control.
  await precacheRoute(OFFLINE_URL, pagesCache, staticCache, seenAssets);
  await precacheRoute('/', pagesCache, staticCache, seenAssets);
  routes.delete(OFFLINE_URL);
  routes.delete('/');

  if (!self.__SW_PRECACHE) {
    try {
      const toolsHtml = await precacheRoute('/tools', pagesCache, staticCache, seenAssets);
      extractRoutes(toolsHtml).forEach((r) => routes.add(r));
      routes.delete('/tools');
    } catch {
      // Best effort.
    }
  }

  // Everything else is best effort: one failing route must not break install.
  const list = [...routes];
  const CONCURRENCY = 6;
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    await Promise.allSettled(
      list.slice(i, i + CONCURRENCY).map((r) => precacheRoute(r, pagesCache, staticCache, seenAssets))
    );
  }

  await Promise.allSettled(
    EXTRA_ASSETS.map(async (asset) => {
      const res = await fetch(asset, { cache: 'reload' });
      if (isCacheableResponse(res)) await assetsCache.put(asset, res);
    })
  );
}

// ── Lifecycle ─────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  // No skipWaiting() here: an updated worker waits until the page asks it to
  // take over (SKIP_WAITING message), so open tabs never swap code mid-session.
  // The very first install has no previous worker, so it activates immediately.
  event.waitUntil(precache());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.includes(key)) // also drops legacy 'devtools-pro-v1'
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'GET_VERSION' && event.source) {
    event.source.postMessage({ type: 'SW_VERSION', version: VERSION });
  }
});

// ── Fetch strategies ──────────────────────────────────────────────────────

async function handleNavigation(event) {
  const { request } = event;
  const key = pageKey(request.url);
  try {
    const response = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
    if (isCacheableResponse(response) && isHtml(response) && !response.redirected) {
      const copy = response.clone();
      event.waitUntil(caches.open(PAGES_CACHE).then((c) => c.put(key, copy)));
    }
    return response;
  } catch {
    // ignoreVary: Next.js sends `Vary: RSC, Next-Router-State-Tree, ...` on HTML.
    const cached =
      (await caches.match(key, { ignoreVary: true })) ||
      (await caches.match(pageKey(OFFLINE_URL), { ignoreVary: true }));
    if (cached) return cached;
    return new Response(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>Offline</title><body style="background:#07070a;color:#e4e4e7;font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0">' +
        '<p>You are offline. Reconnect and reload to use DevTools Pro.</p></body>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/**
 * App Router client navigations/prefetches fetch RSC payloads (`RSC: 1` header,
 * `?_rsc=` param). Their bodies depend on router-state request headers, so caching
 * them by URL could serve the wrong tree. Instead: network only, and on failure
 * answer with a non-OK response — Next.js then falls back to a full browser
 * navigation, which handleNavigation serves from the page cache.
 */
async function handleRsc(request) {
  try {
    return await fetchWithTimeout(request, RSC_TIMEOUT_MS);
  } catch {
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: false, ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    const copy = response.clone();
    caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
  }
  return response;
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (isCacheableResponse(response)) return cache.put(request, response.clone()).then(() => response);
      return response;
    })
    .catch(() => undefined);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  const response = await network;
  return response || new Response('', { status: 504, statusText: 'Offline' });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // never touch POST (/api/feedback) etc.

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never cache cross-origin
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname === '/sw.js' || url.pathname === '/sw-precache.js') return;
  if (url.pathname.startsWith('/_next/webpack-hmr') || url.pathname.startsWith('/__nextjs')) return;
  if (request.headers.has('range')) return;

  if (request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) {
    event.respondWith(handleRsc(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event));
});
