// var CACHE_NAME = 'transit-app-cache-v2';
// var REQUIRED_FILES = [
// 	'/',
// 	'/index.html',
// 	'/css/vendor/wing.min.css',
// 	'/js/App.js',
// 	'/js/indexController.js',
// 	'/js/vendor/jquery.min.js'
// ];
// //added comment to test state changes
//
// self.addEventListener('install', function(event) {
// 	event.waitUntil(
// 		caches.open(CACHE_NAME)
// 		.then(function(cache) {
// 			if (cache != CACHE_NAME) {
// 				cache.delete(cache);
// 			}
// 			return cache.addAll(REQUIRED_FILES);
// 		})
// 		.then(function() {
// 			return self.skipWaiting();
// 		})
// 	);
// });

self.addEventListener('fetch', function(event) {
	event.respondWith(
		new Response('Hello worl')
	);
});

// self.addEventListener('activate', function(event) {
// 	event.waitUntil(
// 		caches.keys().then(function(keyList) {
// 			return Promise.all(keyList.map(function(key) {
// 				if (CACHE_NAME.indexOf(key) === -1) {
// 					return caches.delete(key);
// 				}
// 			}));
// 		})
// 	);
// });
