var CACHE_NAME = 'transi-app-cache-v2';
var urlsToCache = [
  '/',
  '/css/vendor/wing.min.css',
  '/js/index.js',
  '/js/indexController.js',
  '/js/vendor/jquery.min.js'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});
