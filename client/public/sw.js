const CACHE_NAME = 'sahibinden-hayvan-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// Skip caching for these patterns
const SKIP_CACHE_PATTERNS = [
  /\/api\//,
  /\.hot-update\./,
  /sockjs-node/,
  /ws:/,
  /wss:/,
  /__vite/,
  /node_modules/,
  /chrome-extension/,
  /extensions/,
];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.includes('-v2'))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Check if we should skip caching
  const shouldSkip = SKIP_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
  if (shouldSkip) {
    return;
  }
  
  // For navigation requests, use network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }
  
  // For images, use cache-first
  if (request.destination === 'image') {
    event.respondWith(cacheFirstSafe(request));
    return;
  }
  
  // For other requests, use network-first
  event.respondWith(networkFirstSafe(request));
});

async function networkFirstSafe(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse.ok && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      caches.open(DYNAMIC_CACHE).then((cache) => {
        cache.put(request, responseToCache);
      });
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a simple error response
    return new Response('Network error', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

async function cacheFirstSafe(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      caches.open(DYNAMIC_CACHE).then((cache) => {
        cache.put(request, responseToCache);
      });
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Image not available', { status: 404 });
  }
}

self.addEventListener('push', (event) => {
  let data = { title: 'Sahibinden Hayvan', body: 'Yeni bildirim' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
