// Service worker Lexara: hanya menyimpan "kulit" aplikasi (halaman & ikon) agar bisa dibuka cepat/offline.
// Permintaan ke server (API) TIDAK pernah disimpan, supaya data pengguna tidak tersimpan di cache.
const VERSION = 'lexara-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;           // API & font: biarkan langsung ke jaringan
  if(req.mode === 'navigate'){                               // halaman: utamakan versi terbaru, cadangan dari cache
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('/', copy)); return r; }).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if(r.ok && /\.(png|webmanifest)$/.test(url.pathname)){ const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  })));
});
