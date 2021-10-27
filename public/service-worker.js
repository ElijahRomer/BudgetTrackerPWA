console.log(`Hello From your Service Worker!`)

const CACHE_NAME = "BT-static-cache-v1";
const DATA_CACHE_NAME = "BT-data-cache-v1";

const FILES_TO_CACHE = [
  '/', //must include this as when you are offline the landing page is linked to the bare '/' request.
  'manifest.webmanifest',
  'indexedDB.js',
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
  console.log(`checking for outdated cache files...`)
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
            console.log(`No Outdated cache data found.`)
          })
        );
      }).catch(err => console.log(err))
  );
  // tell service worker to immediately take control of the page.
  self.clients.claim();
});



self.addEventListener(`fetch`, event => {
  console.log(`SERVICE-WORKER FETCH EVENT REGISTERED`);


  // if the fetch is for posting a new transaction
  if (event.request.method === 'POST') {
    console.log(`POST FETCH FOR NEW DATA`, event.request.url);
    console.log(event.request.clone())

    // event.respondWith(
    return fetch(event.request.clone())
      .catch((err) => err)
  };

  if (event.request.url.includes("/api/" && event.request.method === "GET")) {
    // TODO: write logic for querying data from indexedDB instead.
    return fetch(event.request)
      .catch((err) => {
        console.log(`FETCH FAILED, PULLING FROM INDEXEDDB`)
        console.log(err)

      })
  }


  // if the fetch is for static files on page load
  if (!event.request.url.includes("/api/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        console.log(`FETCH FOR STATIC FILE`);
        console.log(event.request)
        return cache.match(event.request)
          .then(response => {
            if (!response) {
              console.log(`NOTHING IN CACHE FOR ABOVE REQUEST ${event.request.url}`)
            }
            return response || fetch(event.request);
          });
      })
    );
  }
});