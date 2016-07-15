var CACHE_NAME = 'stache-v1';
var urlsToCache = [
	'/',
	'/index.html',
	'/css/vendor/wing.min.css',
	'/css/styles.css',
	'js/vendor/vendor.min.js',
	'js/app.js'
];

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(CACHE_NAME)
		.then(function(cache) {
			console.log('Opened cache');
			return cache.addAll(urlsToCache);
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
			var fetchRequest = event.request.clone();

			return fetch(fetchRequest).then(
				function(response) {
					if (!response || response.status !== 200 || response.type !== 'basic') {
						return response;
					}
					var responseToCache = response.clone();
					caches.open(CACHE_NAME)
						.then(function(cache) {
							cache.put(event.request, responseToCache);
						});
					return response;
				}
			);
		})
	);
});

self.addEventListener('activate', function(event) {
	var cacheWhitelist = ['stache-v1', 'blog-posts-cache-v1'];
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.map(function(cacheName) {
					if (cacheName != CACHE_NAME) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});
