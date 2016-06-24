class IndexController {
  constructor(){
    this._registerServiceWorker();
  }

  _registerServiceWorker(){
    // Register the ServiceWorker
    navigator.serviceWorker.register('sw.js', {
      scope: '.'
    }).then(function(registration) {
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
  _showCachedMessages(){
    var indexController = this;

    return this._openDatabase().then(function(db) {
      if (!db) return;
      var index = db.transaction('routes', 'readwrite')
      .objectStore('routes').index('description');
      return indexController._addRoutes(index);
    });
  }
  _openDatabase(){
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
    return idb.open('sound-transit-app', 2, function(upgradeDb){
      switch(upgradeDb.oldVersion){
        case 0:
          var store = upgradeDb.createObjectStore('routes', {
            keyPath: 'id'
          });
          store.createIndex('description', 'description');
        case 1:
          store = upgradeDb.createObjectStore('stops', {
            keyPath: 'id'
          });
          store.createIndex('name', 'name');
      }
    });
  }

  _addRoutes(index){
    if(!index) return;
    index.getAll().then(function(data){
      $('#routes').html('');
      var option = '';
      data.map(function(route){
        if (route.shortName.length === 0) {
          route.shortName = 0;
        }
        if (route.description.length === 0) {
          route.description = route.longName;
        }
        option = $('<option />');
        $(option).attr('value', route.id);
        $(option).text('(' + route.shortName + ') ' + route.description);
        $('#routes').append(option);
      });
    });
  }
}

var ic = new IndexController();
ic._showCachedMessages();
