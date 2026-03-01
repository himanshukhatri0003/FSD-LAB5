const mycache = "mypwa-app-v3";
const myfiles = [
  "/",
  "/index.html",
  "/manifest.json"
  
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(mycache).then((cache) => {
      console.log("Attempting to cache files...");
      return Promise.all(
        myfiles.map((url) => {
          return cache.add(url).catch((err) => {
            console.error(`Failed to cache: ${url}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isCoreFile = myfiles.includes(url.pathname);

  // Network First strategy for navigation and core files
  if (event.request.mode === 'navigate' || isCoreFile) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(mycache).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache First strategy for other assets
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).catch((err) => {
          console.warn(`Fetch failed for: ${event.request.url}`, err);
          // Return a null response or handle error gracefully
          return new Response(null, { status: 404, statusText: 'Not Found' });
        });
      })
    );
  }
});