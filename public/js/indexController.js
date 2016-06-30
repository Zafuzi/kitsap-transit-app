class IndexController {
  constructor(){
    this._registerServiceWorker();
  }

  _registerServiceWorker(){
    // Register the ServiceWorker
    navigator.serviceWorker.register('js/sw/sw.js').then(function(registration) {
      // Listen for claiming of our ServiceWorker
      navigator.serviceWorker.addEventListener('controllerchange', function(event) {
        // Listen for changes in the state of our ServiceWorker
        navigator.serviceWorker.controller.addEventListener('statechange', function() {
          // If the ServiceWorker becomes "activated", let the user know they can go offline!
          if (this.state === 'activated') {
            // Show the "You may now use offline" notification
            //document.getElementById('offlineNotification').classList.remove('hidden');
            console.log("offline okay");
          }
        });
      });
    });
  }
  _openDatabase(){
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
    return idb.open('sound-transit-app', 2, function(upgradeDb){
      // switch(upgradeDb.oldVersion){
      //   case 0:
      //     var store = upgradeDb.createObjectStore('routes', {
      //       keyPath: 'id'
      //     });
      //     store.createIndex('description', 'description');
      //   case 1:
      //     store = upgradeDb.createObjectStore('stops', {
      //       keyPath: 'id'
      //     });
      //     store.createIndex('name', 'name');
      // }
    });
  }
}

var ic = new IndexController();
ic._registerServiceWorker();
