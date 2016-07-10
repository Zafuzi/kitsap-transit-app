self.addEventListener('fetch', function(event) {
	event.respondWith(
		new Response("Hello World")
	);
});

self.addEventListener('install', function(event) {
	event.waitUntil(
		console.log("Hello World")
	);
});

self.addEventListener('activate', function(event) {
	console.log("Good to go!");
});
