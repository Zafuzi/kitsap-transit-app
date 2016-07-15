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
			switch (upgradeDb.oldVersion) {
				case 0:
					var store = upgradeDb.createObjectStore('text-files', {
						keyPath: 'name'
					});
			}
		});
	}
}

class Map {
	//CONSTRUCTOR
	constructor(el, key, location, zoom) {
		this.el = el;
		this.key = key;
		this.location = location;
		this.zoom = zoom;
	}

	_createMap() {
		var self = this;
		L.mapbox.accessToken = self.key;
		mapLayer = L.mapbox.map(self.el, 'mapbox.streets')
			.setView(self.location, self.zoom);
		//loadAgencies();
	}
}

var markers = [],
	map, mapLayer, myLayer, featureLayer, infoWindow,
	key = 'AIzaSyA27n8DdEogq7VwNiyE3MZMyyYUyGGpDHY',
	accessToken = 'pk.eyJ1IjoiemFmdXppIiwiYSI6ImNpcHVlMzZpczBjeDVmdm0yZXkwano0MTEifQ.IaYNAY6iPj0xLmAXTO5RmA',
	ic = new IndexController(),
	idb = ic._openDatabase(),
	stop_list = '';

$(function() {
	map = new Map('map', accessToken, [47.662423, -122.601542], 11);
	map._createMap();

	$("#agency_input").on('awesomplete-selectcomplete', function(e) {
		var routeID = e.target.value;
		console.log(e.target.value);
		console.log(e.target);
		loadRoutes(routeID);
		markers.map(marker => {
			if (marker._geojson.properties.id == routeID) {
				//openMarker(marker);
				mapLayer.panTo(new L.LatLng(marker._geojson.geometry.coordinates[1],
					marker._geojson.geometry.coordinates[0]));
				mapLayer.setZoom(10);
			}
		});
	});
});

idb.then(function(db) {
	var tx = db.transaction('text-files', 'readwrite');
	return tx.objectStore('text-files').getAll();
}).then(allObjs => {
	if (allObjs.length < 1) {
		console.log("Getting GTFS");
		getZip('./DATA/gtfs.zip').then(JSZip.loadAsync)
			.then(function(zip) {
				parseCSV(zip)
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

function init() {
	loadStops().then(json => {
		return getStations(json);
	}).then(json => {
		json.map(station => {
			getStop(station.stopIds[0]).then(res => {
				$('#agency_input').attr('data-list', stop_list);
			});
		});
		return Promise.resolve(json);
	}).then(res => {
		console.log(stop_list);
		new Awesomplete($('#agency_input')[0], {
			minChars: 3,
			maxItems: 15
		});
	});

}

function loadStops() {
	console.log("Stations Loading");
	return idb.then(function(db) {
		var tx = db.transaction('text-files', 'readwrite');
		var files = tx.objectStore('text-files').get('stops.txt');
		return files;
	});
}

function getStations(json) {
	var stations = [];
	json.value.map(stop => {
		stop = stop[0];
		if (stations.hasOwnProperty(stop.stop_code)) {
			stations[stop.stop_code].stopIds.push(stop.stop_id);
		} else {
			var data = {};
			data.stopIds = [stop.stop_id];
			data.stopName = stop.stop_name;
			stations[stop.stop_code] = data;
		}
	});
	return stations;
}

function getStop(stop_id) {
	return new Promise((resolve, reject) => {
		loadStops().then(res => {
			res.value.map(stop => {
				stop = stop[0];
				if(!stop.stop_id) return;
				if (stop.stop_id == stop_id) {
					var pos = [stop.stop_lon, stop.stop_lat];
					var marker = L.mapbox.featureLayer({
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: pos
						},
						properties: {
							title: stop.stop_name,
							description: stop.stop_desc,
							id: stop.stop_id,
							'marker-size': 'medium',
							'marker-color': '#80CBC4'
						}
					}).bindPopup(stop.stop_name).addTo(mapLayer);
					markers.push(marker);
					$('#stop_list').append($('<li>').text(stop.stop_name));
					stop_list += ', ' + stop.stop_id;
				}
			});
		});
		resolve(markers);
	});
}

function loadStopTimes() {
	return idb.then(function(db) {
		var tx = db.transaction('text-files', 'readwrite');
		var files = tx.objectStore('text-files').get('stop_times.txt');
		return files;
	});
}

function getStopTimes(json) {
	var stop_times = [];
	json.value.map(stop => {
		stop = stop[0];
		console.log(stop);
	});
	return stations;
}


function getZip(url) {
	fileArray = [];
	return fetch(url).then(function(response) {
		if (response.status === 200 || response.status === 0) {
			return Promise.resolve(response.arrayBuffer());
		}
	});
}

function getFiles(zip) {
	var data = [];
	for (var file in zip.files) {
		data.push({
			name: file,
			data: zip.file(file).async('string')
		});
	}
	return new Promise(function(resolve, reject) {
		if (data) {
			resolve(data);
		} else {
			reject(data);
		}
	}).then(console.log("finished promise"));
}

function parseCSV(zip) {
	return getFiles(zip).then(function(res) {
		res.map(function(file) {
			var data = file.data._result;
			if (data) {
				var wrapArray = [];
				Papa.parse(data, {
					worker: false,
					header: true,
					step: function(results) {
						var row = results.data;
						wrapArray.push(row);
					}
				});
				console.log("parsed");
				addJSON(wrapArray, file.name);
			} else {
				console.log("There was an error processing some of the files");
			}
		});
	});
}

function addJSON(value, key) {
	idb.then(function(db) {
		var tx = db.transaction('text-files', 'readwrite');
		tx.objectStore('text-files').put({
			name: key,
			value: value
		});
		return tx.complete;
	});
}

function loadAgencies() {
	console.log("Routes Loading");
	idb.then(function(db) {
		var tx = db.transaction('text-files', 'readwrite');
		var files = tx.objectStore('text-files').get('routes.txt');
		return files;
	}).then(function(res) {
		console.log(res);
	});
}

function geocode(agency) {
	var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' +
		agency.area +
		agency.country +
		agency.name +
		agency.state +
		'&key=' + key;

	return fetch(url).then(res => {
		if (res.ok) {
			return res.json();
		}
	}).then(json => {
		if (json.results[0]) {

		}
	}).catch(err => {
		console.log(err);
	});
}

function onEachFeature(feature, layer) {
	// does this feature have a property named popupContent?
	if (feature.properties && feature.properties.route_short_name) {
		layer.bindPopup(feature.properties.route_short_name);
	}
}

//NOTE keep this
Date.prototype.yyyymmdd = function() {
	var yyyy = this.getFullYear().toString();
	var mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
	var dd = this.getDate().toString();
	return yyyy + "-" + (mm[1] ? mm : "0" + mm[0]) + "-" + (dd[1] ? dd : "0" + dd[0]); // padding
};

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
