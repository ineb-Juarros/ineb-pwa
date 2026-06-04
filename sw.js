// ============================================================
// Service Worker — INEB Domingo Juarros PWA
// Permite uso offline y carga rápida
// ============================================================

const CACHE_NAME = 'ineb-machs-v1';

// Archivos que se guardan en caché para uso offline
const ARCHIVOS_CACHE = [
  '/',
  '/index.html',
  '/formulario.html',
  '/consolidado.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap'
];

// Instalar: guardar archivos en caché
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ARCHIVOS_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activar: limpiar cachés viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: servir desde caché, si no hay buscar en red
self.addEventListener('fetch', e => {
  // No cachear peticiones al Apps Script (deben ir siempre a la red)
  if (e.request.url.includes('script.google.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Guardar en caché respuestas exitosas
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Sin red: devolver página principal del caché
        return caches.match('/index.html');
      });
    })
  );
});
