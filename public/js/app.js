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

WebFontConfig = {
  google: {
    families: ['Raleway,500,700::latin', 'Lato,300,500,900::latin', 'Material+Icons::latin']
  }
};
(function () {
  var wf = document.createElement('script');
  wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
  wf.type = 'text/javascript';
  wf.async = 'true';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(wf, s);
})();

class GTFS_Controller {
  constructor(zip_name) {
    this.zip = this._getZip(zip_name);
  }
  _getZip(url) {
    return fetch(url).then(function(response) {
      if (response.status === 200 || response.status === 0) {
        return Promise.resolve(response.arrayBuffer());
      }
    });
  }
  _getFilesFromZip(zip_obj) {
    var self = this;
    var data = [];
    for (var file in zip_obj.files) {
      data.push({
        name: file,
        data: zip_obj.file(file).async('string')
      });
    }
    return new Promise(function(resolve, reject) {
      if (data) {
        resolve(data);
      } else {
        reject(data);
      }
    }).then(console.log("Files Returned"));
  }
  _parseCSVFromFiles(zip_obj) {
    var self = this;
    return self._getFilesFromZip(zip_obj).then(files => {
      files.map(file => {
        var data = file.data._result;
        if (data) {
          var wrapArray = [];
          Papa.parse(data, {
            worker: false,
            header: true,
            step: results => {
              wrapArray.push(results.data);
            }
          });
          idb.then(db => {
            const tx = db.transaction('text-files', 'readwrite')
              .objectStore('text-files').put({
                name: file.name.split('.')[0],
                data: wrapArray
              });
            return tx.complete;
          });
        } else {
          console.log("There was an error processing some of the files");
        }
      });
    });
  }
}

class DatabaseController {
  _getIndexedData() {
    var self = this;
    self.routes = taf({
      name: 'routes'
    });
    self.trips = taf({
      name: 'trips'
    });
    self.stoptimes = taf({
      name: 'stop_times'
    }).first().data;
    self.stops = taf({
      name: 'stops'
    }).first().data;
    self.calendar = taf({
      name: 'calendar'
    });
    self.transfers = taf({
      name: 'transfers'
    });
  }
  _findTripsForRoute(routeID) {
    var self = this;
    var keys = self.trips.first().data
      .map((trip, key) => {
        if (trip[0].route_id == routeID && trip[0].service_id == serviceDates()) {
          return trip[0].trip_id;
        }
      }).filter(n => {
        return n != undefined;
      });
    return keys;
  }
  _findStopTimesForTrip(tripID) {
    var self = this;
    var stops = self.stoptimes.filter(n => {
      return (n[0].trip_id == tripID) ? n[0] : undefined;
    }).filter(n => {
      return n != undefined;
    });
    return stops;

  }
  _getStop(stopID) {
    var self = this;
    var stops = self.stops.filter(n => {
      return (n[0].stop_id == stopID) ? n[0] : undefined;
    }).filter(n => {
      return n != undefined;
    });
    return stops;
  }
}

var ic = new IndexController(),
  idb = ic._openDatabase(),
  dbc = new DatabaseController(),
  taf, gtfs, stops = [],
  worker, currentTrips, currentStopTimes, tripType;

$(function() {
  /*
   * Checking if database has data
   * If there is no data present create a new GTFS_Controller and parse the GTFS zip file
   * If data exists call init()
   */

  idb.then(function(db) {
    var tx = db.transaction('text-files', 'readwrite');
    return tx.objectStore('text-files').getAll();
  }).then(files => {
    if (!files) return false;
    if (files.length < 1) {
      gtfs = new GTFS_Controller('./DATA/gtfs.zip');
      gtfs.zip.then(JSZip.loadAsync)
        .then(zip_obj => {
          gtfs._parseCSVFromFiles(zip_obj)
            .then(init)
            .catch(err => console.log(err));
        })
        .catch(function(err) {
          throw new Error(err, " GTFS not Found");
        });
    } else {
      init();
    }
  });

  taf = TAFFY([]);
  $("#route_list").on('change', function(e) {
    var routeID = e.target.value;
    $('#times_table').html('');
    stops = [];
    loadStops(routeID);
  });
  $("#stop_table").on('change', function(e) {
    var stopID = e.target.value;
    var stop_data = dbc._getStop(stopID);
    $('#times_table').html('');
    var oldtime, oldkey;
    stops.map((stop_data, key) => {
      if (stop_data.id == stopID) {
        switch (tripType) {
          case 'start':
            //start times
            $('#times_table').append(
              $('<button class="row padded start_button">').text(formatTime(stop_data.stoptime.departure_time))
              .data('label', [stop_data.routeID, stop_data.stop.stop_name, stop_data.stoptime.departure_time])
              .attr('id', stop_data.routeID)
            );
            break;
          case 'end':
            //start times
            $('#times_table').append(
              $('<button class="row padded end_button">').text(formatTime(stop_data.stoptime.departure_time))
              .data('label', [stop_data.routeID, stop_data.stop.stop_name, stop_data.stoptime.departure_time])
              .attr('id', stop_data.routeID)
            );
            break;
        }
      }
    });
    $('.start_button').click(function(e) {
      var id = e.target.id;
      var data = $('#' + id).data('label')[0] + ' | ' + $('#' + id).data('label')[1] + ' ' + $('#' + id).data('label')[2];
      $('#departure_header').text(data);
    });
    $('.end_button').click(function(e) {
      var id = e.target.id;
      var data = $('#' + id).data('label')[0] + ' | ' + $('#' + id).data('label')[1] + ' ' + $('#' + id).data('label')[2];
      $('#arrival_header').text(data);
    });
  });
  $('#choose_departure').on('click', function() {
    if ($('#trip_header').is(':visible')) {
      $('#trip_header').fadeToggle(250, () => {
        $('#trip_header').text('Depart From: ');
      });
    }
    tripType = 'start';
    $('#trip_header').fadeToggle(250).delay(200);
    $('#trip_header').text('Depart From: ');
  });
  $('#choose_arrival').on('click', function() {
    if ($('#trip_header').is(':visible')) {
      $('#trip_header').fadeToggle(250, () => {
        $('#trip_header').text('Arrive At: ');
      });
    }
    tripType = 'end';
    $('#trip_header').fadeToggle(250).delay(200);
    $('#trip_header').text('Arrive At: ');
  });
});

function formatTime(time) {
  time = time.split(':');
  hours = time[0];
  minutes = time[1];
  return hours + ':' + minutes;
}

function loadStops(routeID) {
  $('#times_table').html('');
  stops = [];
  currentTrips = dbc._findTripsForRoute(routeID);
  var currentStopTimes = [];
  currentTrips.map(id => {
    currentStopTimes.push(dbc._findStopTimesForTrip(id));
  });
  $('#stop_table').html('');
  currentStopTimes.map(stoptime => {
    if (!stoptime || stoptime.length <= 0) return;
    stoptime.map(time => {
      if (!time[0].stop_id || !time[0].departure_time) return;
      var stop_data = dbc._getStop(time[0].stop_id)[0];
      stops.push({
        id: time[0].stop_id,
        routeID: routeID,
        stoptime: time[0],
        stop: stop_data[0]
      });
      if (!$('#' + time[0].stop_id).length) {
        $('#stop_table').append($('<option id="' + time[0].stop_id + '">')
          .text(stop_data[0].stop_name).val(time[0].stop_id));
      }
    });
  });
}

// Initializes the main application (Only called after loading the DB)
function init() {
  idb.then(db => {
    return db.transaction('text-files', 'readwrite')
      .objectStore('text-files').getAll();
  }).then(files => {
    files.map(file => {
      taf.insert(file);
    });
  }).then(() => {
    dbc._getIndexedData();
    appendRoutes();
  });
}

function appendRoutes() {
  var data = dbc.routes.first().data;
  data.map(route => {
    route = route[0];
    $('#route_list').append(
      $('<option class="col-6">').val(route.route_id)
      .text(route.route_id + ' | ' + route.route_long_name)
    );
  });
}

const serviceDates = function() {
  //TODO allow setting custom day to see the entire schedule
  var n = new Date().getDay();
  switch (n) {
    case (n < 6):
      return 'mtwtf';
      break;
    case 6:
      return 'sat';
      break;
    default:
      return 'mtwtf';
      break;
  }
};
