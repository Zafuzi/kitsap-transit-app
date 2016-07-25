class IndexController {
	constructor() {
		this._registerServiceWorker();
	}

	_registerServiceWorker() {
		var self = this;
		navigator.serviceWorker.register('sw.js').then(function(registration) {
			console.log("here reg");
			navigator.serviceWorker.addEventListener('controllerchange', function(event) {
				console.log("here controller change");
				navigator.serviceWorker.controller.addEventListener('statechange', function() {
					console.log("here state change");
					if (this.state === 'activated') {
						console.log("offline okay");
					} else {
						console.log(this.state);
					}
				});
			});
		});
	}

	_openDatabase() {
		if (!navigator.serviceWorker) {
			console.log("Error loading database");
			return Promise.resolve();
		}
		return idb.open('sound-transit-app', 1, function(upgradeDb) {
			console.log('got here');
			switch (upgradeDb.oldVersion) {
				case 0:
					var store = upgradeDb.createObjectStore('text-files', {
						keyPath: 'name'
					});
			}
		});
	}
}
