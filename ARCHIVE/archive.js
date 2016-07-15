var idb = ic._openDatabase();

idb.then(function(db) {
	var tx = db.transaction('text-files', 'readwrite');
	return tx.objectStore('text-files').getAll();
}).then(allObjs => {
	if (allObjs.length < 1) {
		console.log("Getting GTFS");
		getZip('./DATA/40_gtfs.zip').then(JSZip.loadAsync)
			.then(function(zip) {
				parseCSV(zip)
					.then(loadAgencies)
					.catch(err => console.log(err));
			})
			.catch(function(err) {
				throw new Error(err, " GTFS not Found");
			});
	} else {
		//loadAgencies();
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

function loadTrips(routeID) {
	console.log(routeID);
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
				stop_name_array.push({
					id: trip[0][1],
					name: trip[0][3]
				});
			}
		});
		stop_name_array = clearDupes(stop_name_array);
		console.log(stop_name_array);

		stop_name_array.map(function(st) {
			getStopTimes(st.id);
		});
	});
}

function getStops(stopID) {
	console.log("Stops Loading");
	var stops = $('#stops');
	stops.html('');
	idb.then(function(db) {
		var tx = db.transaction('text-files', 'readwrite');
		var files = tx.objectStore('text-files').get('stops.txt');
		return files;
	}).then(function(res) {
		res.value.map(function(stop) {
			if (stop[0][0] == stopID) {
				//NOTE check against the calendar times
				if (stops.find('button').html() == stop[0][4]) {
					return;
				} else {
					var button = $('<button>');
					button.html(stop[0][4]);
					stops.append(button);
					console.log("got here");
				}
			}
		});
	});
}

function getStopTimes(stopName) {
	console.log("Stop times loading");
	idb.then(function(db) {
		var tx = db.transaction('text-files', 'readwrite');
		var files = tx.objectStore('text-files').get('stop_times.txt');
		return files;
	}).then(function(res) {
		res.value.map(function(stopTime) {
			if (stopTime[0][0] == stopName) {
				if (stopTime[0][3]) {
					getStops(stopTime[0][1]);
				}
			}
		});
	});
}
