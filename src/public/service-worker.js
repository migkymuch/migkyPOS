// Service Worker for POS System PWA
// Version 1.0.0 - Cache-first strategy for assets, Stale-While-Revalidate for images

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `pos-static-${CACHE_VERSION}`;
const IMAGES_CACHE = `pos-images-${CACHE_VERSION}`;

// Assets to precache (Cache-first strategy)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Add other static assets here
];

// Install event - precache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Force the waiting service worker to become active
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    // Clean up old caches
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete caches that don't match current version
            if (cacheName.startsWith('pos-') && 
                cacheName !== STATIC_CACHE && 
                cacheName !== IMAGES_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle caching strategies
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle different types of requests with appropriate strategies
  if (event.request.method === 'GET') {
    // Static assets - Cache-first strategy
    if (isStaticAsset(event.request)) {
      event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    }
    // Images - Stale-While-Revalidate strategy
    else if (isImageRequest(event.request)) {
      event.respondWith(staleWhileRevalidate(event.request, IMAGES_CACHE));
    }
    // API calls - Network-first (with offline fallback if needed)
    else if (isApiRequest(event.request)) {
      event.respondWith(networkFirst(event.request));
    }
    // Default - try network first, fallback to cache
    else {
      event.respondWith(networkFirst(event.request));
    }
  }
});

// Cache-first strategy: Check cache first, fallback to network
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }
    
    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first error:', error);
    // Return offline fallback if available
    return new Response('Offline', { status: 503 });
  }
}

// Stale-While-Revalidate strategy: Serve from cache, update in background
async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Start network request in background
    const networkResponsePromise = fetch(request)
      .then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => {
        // Network failed, but we might have cache
        return null;
      });
    
    // Return cached version immediately if available
    if (cachedResponse) {
      console.log('[SW] Serving from cache (SWR):', request.url);
      // Don't await network request - let it update cache in background
      networkResponsePromise.catch(() => {}); // Ignore network errors
      return cachedResponse;
    }
    
    // No cache, wait for network
    console.log('[SW] No cache, waiting for network (SWR):', request.url);
    const networkResponse = await networkResponsePromise;
    return networkResponse || new Response('Offline', { status: 503 });
    
  } catch (error) {
    console.error('[SW] Stale-while-revalidate error:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy: Try network first, fallback to cache
async function networkFirst(request) {
  try {
    console.log('[SW] Network first:', request.url);
    const networkResponse = await fetch(request);
    
    // Cache successful responses for offline fallback
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Try to serve from cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache available
    console.error('[SW] Network-first error, no cache:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Helper functions to categorize requests

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.endsWith('.html') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.json') ||
         url.pathname === '/';
}

function isImageRequest(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i) ||
         url.hostname.includes('images.unsplash.com') ||
         url.hostname.includes('via.placeholder.com');
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') ||
         url.hostname.includes('firestore.googleapis.com') ||
         url.hostname.includes('firebase.googleapis.com');
}

// Handle background sync (for offline queue functionality)
self.addEventListener('sync', event => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'pos-offline-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('[SW] Syncing offline data...');
    
    // TODO: Implement offline queue sync
    // This would read from IndexedDB and sync pending actions
    // For now, just post a message to the main thread
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'OFFLINE_SYNC',
        status: 'started'
      });
    });
    
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    clients.forEach(client => {
      client.postMessage({
        type: 'OFFLINE_SYNC',
        status: 'completed'
      });
    });
    
    console.log('[SW] Offline data sync completed');
  } catch (error) {
    console.error('[SW] Offline sync failed:', error);
  }
}

// Handle push notifications (for order updates)
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  // TODO: Implement push notification handling
  // This would show notifications for new orders, status updates, etc.
  
  const options = {
    body: 'มีออเ��อร์ใหม่เข้ามา',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      type: 'order',
      action: 'view'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('ระบบ POS', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.notification.data);
  
  event.notification.close();
  
  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        if (clients.length > 0) {
          // Focus existing window
          return clients[0].focus();
        } else {
          // Open new window
          return self.clients.openWindow('/');
        }
      })
  );
});

console.log('[SW] Service worker loaded, version:', CACHE_VERSION);