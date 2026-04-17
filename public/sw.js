// =====================================================================
// Perspectempo — service worker
//
// Estratégia:
//   - HTML (navegação): network-first com fallback pro shell em cache.
//   - Assets versionados (/assets/*): cache-first imutável.
//   - Tudo mais: stale-while-revalidate.
//
// Versionar pela data do build evita ficar preso em assets antigos.
// =====================================================================

const VERSION = 'pst-v1-2026-04-17';
const SHELL_CACHE = `shell-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;

const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(c => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== SHELL_CACHE && k !== ASSET_CACHE).map(k => caches.delete(k)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Só interceptamos same-origin. Fontes do Google passam direto.
  if (url.origin !== self.location.origin) return;

  // HTML / navegação → network-first, fallback shell.
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(SHELL_CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(c => c || caches.match('/index.html'))),
    );
    return;
  }

  // Assets versionados (Vite emite /assets/[hash].js|css) → cache-first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(ASSET_CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })),
    );
    return;
  }

  // Resto → stale-while-revalidate.
  event.respondWith(
    caches.match(req).then(hit => {
      const fresh = fetch(req).then(res => {
        const copy = res.clone();
        caches.open(ASSET_CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit);
      return hit || fresh;
    }),
  );
});
