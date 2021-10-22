console.log(`Hello From your Service Worker!`)

const CACHE_NAME = "BT-static-cache-v1";
const DATA_CACHE_NAME = "BT-data-cache-v1";

const FILES_TO_CACHE = [
  '/index.html',
  '/index.js',
  '/service-worker.js',
  '/styles.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];


self.addEventListener(`install`, event => {
  console.log(`SERVICE-WORKER INSTALL EVENT FIRED`);
  // pre cache all static assets
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .catch(err => console.log(err))
  );
  // activate immediately once finished installing
  self.skipWaiting();
});

self.addEventListener(`activate`, event => {
  console.log(`SERVICE-WORKER ACTIVATE EVENT FIRED`);
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      }).catch(err => console.log(err))
  );

  self.clients.claim();
});

self.addEventListener(`fetch`, event => {
  console.log(`SERVICE-WORKER FETCH EVENT FIRED`);
  console.log(event)
  console.log(event.request)
});

