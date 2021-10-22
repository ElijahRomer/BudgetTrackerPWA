console.log(`Hello From your Service Worker!`)

const CACHE_NAME = "BT-static-cache-v1";
const DATA_CACHE_NAME = "BT-data-cache-v1";

const FILES_TO_CACHE = [
  '/',
  '/offline.html',
  '/index.html',
  '/index.js',
  '/service-worker.js',
  '/styles.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener(`install`, (e) => {
  console.log(`SERVICE-WORKER INSTALL FIRED`)
})

