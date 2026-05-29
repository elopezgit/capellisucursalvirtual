const CACHE_NAME = 'capelli-premium-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './data.js',
  './manifest.json',
  './img/productos/en_preparacion.png',
  './img/logo/capellilogo.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Outfit:wght@300;400;500;600;700;800&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).catch(err => {
      console.warn("Fallo precaché inicial:", err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Ignorar peticiones de API externa o llamadas a esquemas raros
  if (e.request.url.includes('wa.me') || e.request.url.includes('whatsapp') || !e.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Devolvemos el caché de inmediato, pero intentamos actualizar de fondo (Stale-While-Revalidate)
        fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(e.request, networkResponse);
              });
            }
          })
          .catch(() => {/* silenciar fallos de red offline */});
        return cachedResponse;
      }
      
      // Si no está en caché, lo buscamos en la red y lo guardamos
      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        
        return networkResponse;
      }).catch(() => {
        // Fallback offline para imágenes u otros recursos
        if (e.request.destination === 'image') {
          return caches.match('./img/productos/en_preparacion.png');
        }
      });
    })
  );
});
