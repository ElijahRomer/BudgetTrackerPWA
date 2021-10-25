console.log(`Hello From your Service Worker!`)

const CACHE_NAME = "BT-static-cache-v1";
const DATA_CACHE_NAME = "BT-data-cache-v1";

const FILES_TO_CACHE = [
  '/', //must include this as when you are offline the landing page is linked to the bare '/' request.
  'manifest.webmanifest',
  '/index.html',
  '/index.js',
  '/service-worker.js',
  '/styles.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];


self.addEventListener(`install`, event => {
  console.log(`SERVICE-WORKER INSTALL EVENT REGISTERED`);
  // pre cache all static assets
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(msg => console.log(`Static Files Cached!`))
      .catch(err => console.log(err))
  );
  // activate immediately once finished installing
  self.skipWaiting();
});

self.addEventListener(`activate`, event => {
  console.log(`SERVICE-WORKER ACTIVATE EVENT REGISTERED`);
  event.waitUntil(
    // grab full list of cache keys
    caches.keys()
      .then(keyList => {
        return Promise.all(
          // check each cache key to see if it matches our current cache keys and if not delete it.
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      }).catch(err => console.log(err))
  );
  // tell service worker to immediately take control of the page.
  self.clients.claim();
});

self.addEventListener(`fetch`, event => {
  console.log(`SERVICE-WORKER FETCH EVENT REGISTERED`);
  // when fetch event registered, open data cache
  console.log(event);

  if (event.request.url.includes(`/api/`)) {
    console.log(`FETCH FOR API DATA`, event.request.url);
    console.log(event.request)

    event.respondWith(
      caches.open(DATA_CACHE_NAME)
        .then(cache => {
          console.log(cache);
          // then make the fetch request to the server
          return fetch(event.request)
            .then(response => {
              console.log(response);

              // if the response from server is status 200 add to the cache with key as the request url and the value as the response.
              if (response.status === 200) {
                cache.put(event.request.url, response.clone())
              }
              // if the response succeeds OR if response from the server is something other than status 200
              return response;
            })
            .catch(err => cache.match(event.request));
        }));
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      console.log(`FETCH FOR STATIC FILE`);
      // console.log(cache);
      // console.log(event)
      console.log(event.request)
      return cache.match(event.request).then(response => {
        if (!response) {
          console.log(`NOTHING IN CACHE FOR ABOVE REQUEST`)
        }
        return response || fetch(event.request);
      });
    })
  );
});

self.addEventListener(`sync`, (event) => {
  console.log(`\nSERVICE-WORKER SYNC EVENT FIRED\n`)
})