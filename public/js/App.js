var lat, lng, zip, stop_name_array = [];

var ic = new IndexController();
var idb = ic._openDatabase();

idb.then(function(db) {
	var tx = db.transaction('text-files', 'readwrite');
	return tx.objectStore('text-files').getAll();
}).then(allObjs => {
	if (allObjs.length < 1) {
		console.log("Getting GTFS");
		getZip('./DATA/gtfs.zip').then(JSZip.loadAsync)
			.then(function(zip) {
				parseCSV(zip)
					.then(loadRoutes)
					.catch(err => console.log(err));
			})
			.catch(function(err) {
				throw new Error(err, " GTFS not Found");
			});
	} else {
		loadRoutes();
	}
});

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
					step: function(results) {
						wrapArray.push(results.data);
					}
				});
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

function loadRoutes() {
	console.log("Routes Loading");
	var routes = $('#routes');
	idb.then(function(db) {
		var tx = db.transaction('text-files', 'readwrite');
		var files = tx.objectStore('text-files').get('routes.txt');
		if (files) return files;
	}).then(function(res) {
		res.value.map(function(route, key) {
			var option = $('<option>');
			if (key !== 0 && route[0][0]) {
				option.val(route[0][0]);
				option.html(route[0][3]);
				routes.append(option);
			}
		});
	});
}

function loadTrips(routeID) {
	console.log("Trips Loading");
	var trips = $('#trips');
	trips.html('');
	idb.then(function(db) {
		var tx = db.transaction('text-files', 'readwrite');
		var files = tx.objectStore('text-files').get('trips.txt');
		return files;
	}).then(function(res) {
		stop_name_array = [];
		res.value.map(function(trip, key) {
			if (trip[0][0] && trip[0][0] == routeID) {
				stop_name_array.push(trip[0][2]);
				console.log(trip[0][2]);
			}
		});
		stop_name_array = clearDupes(stop_name_array);
		console.log(stop_name_array);

		stop_name_array.map(function(st) {
			var stop_heading = $('<div>');
			$(stop_heading).attr('id', st);
			stop_heading.html(st);
			$('#trips').append(stop_heading);
			getStopTimes(st);
		});
	});
}

function getStopTimes(stopName) {
	console.log("Stops Loading");
	var stops = $('div[id="' + stopName + '"]');
	stops.find('p').empty();
	idb.then(function(db) {
		var tx = db.transaction('text-files', 'readwrite');
		var files = tx.objectStore('text-files').get('stop_times.txt');
		return files;
	}).then(function(res) {
		var currentIndex = 0;
		res.value.map(function(stop, key) {
			//var button = $('<p class="stop-loader">');
			if (stop[0][0] === stopName) {
				//console.log(stop);
				// if (stop[0][4] == 1) {
				// 	button.html(stop[0][3]);
				// 	stops.append(button);
				// }
			}
		});
	});
}

function clearDupes(array) {
	var uarray = [];
	array.map(function(el, i) {
		if ($.inArray(el, uarray) === -1) uarray.push(el);
	});
	return uarray;
}

$(function() {
	$('#routes').on('change', function(e) {
		var routeID = e.currentTarget.selectedOptions[0].value;
		loadTrips(routeID);
	});
});
