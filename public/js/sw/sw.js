var CACHE_NAME = 'transit-app-cache-v2';
var REQUIRED_FILES = [
  '/',
  '/css/vendor/wing.min.css',
  '/js/index.js',
  '/js/indexController.js',
  '/js/vendor/jquery.min.js'
];
//added comment to test state changes

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        if(cache != CACHE_NAME){
          cache.delete(cache);
        }
        return cache.addAll(REQUIRED_FILES);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
   event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (CACHE_NAME.indexOf(key) === -1) {
          return caches.delete(key);
        }
      }));
    })
  );
});
