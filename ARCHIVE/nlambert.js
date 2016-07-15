// Initialize
(function() {
		function documentReady() {
			return new Promise(function(resolve) {
				function checkState() {
					if (document.readyState !== 'loading') {
						resolve();
					}
				}
				document.addEventListener('readystatechange', checkState);
				checkState();
			});
		}
		// http://stackoverflow.com/questions/3066586/get-string-in-yyyymmdd-format-from-js-date-object
		Date.prototype.yyyymmdd = function() {
			var mm = this.getMonth() + 1;
			var dd = this.getDate();
			return [this.getFullYear(), !mm[1] && '0', mm, !dd[1] && '0', dd].join('');
		};
		// Get All stations
		function getStations() {
			return fetch('/gtfs/stops.json')
				.then(function(res) {
					return res.json();
				})
				.then(function(stops) {
					var stations = {};
					stops.forEach(function(stop) {
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
				});
		}

		function getDirections(stopIds) {
			var _stopIds = stopIds,
				_tripIds = [],
				_directions = {};

			function _setTripIds() {
				return fetch('/gtfs/stop_times.json').then(function(res) {
					return res.json();
				}).then(function(stop_times) {
					// The stop times are already sorted by trip and sequence
					// Remove terminus because it is not a valid destination for itself
					for (var i = 0; i < stop_times.length; ++i) {
						if (i === stop_times.length - 1) {
							stop_times.splice(i, 1);
						} else {
							var a = stop_times[i];
							var b = stop_times[i + 1];
							if (a.trip_id != b.trip_id) {
								stop_times.splice(i, 1);
							}
						}
					}
					stop_times.forEach(function(stop_time) {
						if (_stopIds.indexOf(stop_time.stop_id) >= 0) {
							_tripIds.push(stop_time.trip_id);
						}
					});
				});
			}

			function _setDirections() {
				return fetch('/gtfs/trips.json').then(function(res) {
					return res.json();
				}).then(function(trips) {
					trips.forEach(function(trip) {
						if (_tripIds.indexOf(trip.trip_id) >= 0) {
							_directions[trip.route_id + trip.direction_id] = trip.trip_headsign;
						}
					});
				});
			}
			return _setTripIds().then(_setDirections).then(function() {
				return {
					tripIds: _tripIds,
					directions: _directions
				}
			});
		}

		function getDepartures(data) {
			var _stopIds = data.stopIds;
			var _directionInfo = data.directionInfo;
			var _day = data.weekday;
			var _minTime = data.minTime;
			var _tripIds = [];
			var _invalidServiceIds = [];
			var _serviceIds = [];
			var _departures = [];
			// Get calendar exceptions
			function _setInvalidServiceIds() {
				return fetch('/gtfs/calendar_dates.json')
					.then(function(res) {
						return res.json()
					})
					.then(function(calExceptions) {
						var yyyymmdd = (new Date()).yyyymmdd();
						calExceptions.forEach(function(calException) {
							if (calException.date == yyyymmdd) {
								_invalidServiceIds.push(servDate.service_id);
							}
						});
					});
			}
			// Get calendar
			function _setServiceIds() {
				return fetch('/gtfs/calendar.json')
					.then(function(res) {
						return res.json()
					})
					// Get valid service ids
					.then(function(calServDates) {
						var yyyymmdd = (new Date()).yyyymmdd();
						var d = new Date();
						var weekdays = new Array(7);
						weekdays[0] = 'sunday';
						weekdays[1] = 'monday';
						weekdays[2] = 'tuesday';
						weekdays[3] = 'wednesday';
						weekdays[4] = 'thursday';
						weekdays[5] = 'friday';
						weekdays[6] = 'saturday';
						var weekday = weekdays[_day];
						calServDates.forEach(function(servDate) {
							if (_invalidServiceIds.indexOf(servDate.service_id) < 0) {
								if (servDate[weekday] == '1') {
									_serviceIds.push(servDate.service_id);
								}
							}
						});
					});
			}

			function _setTrips() {
				return fetch('/gtfs/trips.json')
					.then(function(res) {
						return res.json()
					})
					.then(function(trips) {
						trips.forEach(function(trip) {
							if (trip.direction_id === _directionInfo.substr(1, 1) && trip.route_id === _directionInfo.substr(0, 1) && _serviceIds.indexOf(trip.service_id) >= 0) {
								_tripIds.push(trip.trip_id);
							}
						});
					})
			}

			function _setDepartures() {
				return fetch('/gtfs/stop_times.json')
					.then(function(res) {
						return res.json()
					})
					// Filter stops times to get next departure
					.then(function(stop_times) {
						_departures = stop_times.filter(function(stop) {
							return _stopIds.indexOf(stop.stop_id) >= 0 &&
								_minTime < stop.departure_time.replace(':', '') &&
								_tripIds.indexOf(stop.trip_id) >= 0;
						}).sort(function(a, b) {
							var aTime = a.departure_time.replace(/:/g, '');
							var bTime = b.departure_time.replace(/:/g, '');
							return aTime - bTime;
						});
					});
			}

			function _removeMergedDepartures() {
				for (var i = 1; i < _departures.length; ++i) {
					if (_departures[i].departure_time === _departures[i - 1].departure_time) {
						_departures.splice(i, 1);
					}
				}
			}
			return _setInvalidServiceIds().then(_setServiceIds).then(_setTrips).then(_setDepartures).then(_removeMergedDepartures).then(function() {
				return {
					departures: _departures,
					tripIds: _tripIds
				};
			});
		}

		function getTrip(data) {
			var _departureTime = data.departureTime;
			var _tripIds = [data.tripId];
			var _trip = [];
			var _stopInfo = {};

			function _setTrip() {
				return fetch('/gtfs/stop_times.json')
					.then(function(res) {
						return res.json();
					}).then(function(stops) {
						_trip = stops.filter(function(stop) {
							var a = parseInt(stop.departure_time.replace(/:/g, ''));
							var b = parseInt(_departureTime.replace(/:/g, ''))
							var t = a >= b;
							var r = _tripIds.indexOf(stop.trip_id) >= 0;
							return r && t;
						});
					});
			}

			function _setStopInfo() {
				return fetch('/gtfs/stops.json')
					.then(function(res) {
						return res.json();
					})
					.then(function(stops) {
						stops.forEach(function(stop) {
							_stopInfo[stop.stop_id] = stop.stop_name;
						});
					});
			}

			function _updateTrip() {
				for (var i = 0; i < _trip.length; i++) {
					_trip[i].stop_name = _stopInfo[_trip[i].stop_id];
				}
			}
			return _setTrip().then(_setStopInfo).then(_updateTrip).then(function() {
				return _trip;
			});
		}

		function appendTrip(e) {
			e.preventDefault();
			// If we already have the submenu, no need to fetch it
			if (this.nextSibling && this.nextSibling.firstChild) return;
			var departure = this.parentNode;
			getTrip(departure.data).then(function(stops) {
				var ul = departure.querySelector('.submenu');
				stops.forEach(function(stop) {
					var li = document.createElement('li');
					var a = document.createElement('a');
					a.textContent = stop.departure_time + ': ' + stop.stop_name;
					li.appendChild(a);
					ul.appendChild(li);
				});
			});
		}
		// Direction click callback
		function appendDepartures(e) {
			e.preventDefault();
			// If we already have the submenu, no need to fetch it
			if (this.nextSibling && this.nextSibling.firstChild) return;
			var weekday = this.parentNode;
			var direction = weekday.data.parent;
			var station = direction.data.parent;
			var data = {
				stopIds: station.data.stopIds,
				directionInfo: direction.data.directionInfo,
				minTime: weekday.data.minTime,
				weekday: weekday.data.weekday
			}
			getDepartures(data).then(function(departureData) {
				var departures = departureData.departures;
				var tripIds = departureData.tripIds;
				if (departures.length) {
					var ul = weekday.querySelector('.submenu');
					departures.forEach(function(departure) {
						var li = document.createElement('li');
						var a = document.createElement('a');
						var submenu = document.createElement('ul');
						a.textContent = departure.departure_time;
						a.href = '#';
						a.addEventListener('click', appendTrip);
						submenu.className = 'submenu';
						var d = {
							tripId: departure.trip_id,
							departureTime: departure.departure_time,
							parent: weekday
						}
						li.data = d;
						ul.appendChild(li);
						li.appendChild(a);
						li.appendChild(submenu);
					});
				} else {
					var a = document.createElement('a');
					a.textContent = 'No departures';
					weekday.appendChild(a);
				}
			});
		}

		function appendDays(e) {
			e.preventDefault();
			// If we already have the submenu, no need to fetch it
			if (this.nextSibling && this.nextSibling.firstChild) return;
			var weekdays = {};
			weekdays.next = {
				code: 8,
				text: 'See next departures'
			};
			weekdays.monday = {
				code: 1,
				text: 'Monday\'s schedule'
			};
			weekdays.tuesday = {
				code: 2,
				text: 'Tuesday\'s schedule'
			};
			weekdays.wednesday = {
				code: 3,
				text: 'Wednesday\'s schedule'
			};
			weekdays.thursday = {
				code: 4,
				text: 'Thursday\'s schedule'
			};
			weekdays.friday = {
				code: 5,
				text: 'Friday\'s schedule'
			};
			weekdays.saturday = {
				code: 6,
				text: 'Saturday\'s schedule'
			};
			weekdays.sunday = {
				code: 0,
				text: 'Sunday\'s schedule'
			};
			var direction = this.parentNode;
			var ul = direction.querySelector('.submenu');
			for (var weekday in weekdays) {
				var li = document.createElement('li');
				var a = document.createElement('a');
				var submenu = document.createElement('ul');
				a.textContent = weekdays[weekday].text;
				a.href = '#';
				a.addEventListener('click', appendDepartures);
				submenu.className = 'submenu';
				d = {
					weekday: (weekdays[weekday].code === 8) ? (new Date).getDay() : weekdays[weekday].code,
					minTime: (weekdays[weekday].code === 8) ? (new Date).toTimeString().substr(0, 8) : '00:00:00',
					parent: direction
				}
				li.data = d;
				li.appendChild(a);
				li.appendChild(submenu);
				ul.appendChild(li);
			}
		}
		// Station click callback
		function appendDirections(e) {
			e.preventDefault();
			// If we already have the submenu, no need to fetch it
			if (this.nextSibling && this.nextSibling.firstChild) return;
			var station = this.parentNode;
			var ul = station.querySelector('.submenu');
			// Directions
			getDirections(station.data.stopIds).then(function(directionData) {
				for (var directionInfo in directionData.directions) {
					var li = document.createElement('li');
					var a = document.createElement('a');
					var submenu = document.createElement('ul');
					a.textContent = directionData.directions[directionInfo];
					a.href = '#';
					a.addEventListener('click', appendDays);
					submenu.className = 'submenu';
					var itemData = {};
					itemData.directionInfo = directionInfo;
					itemData.stationInfo = station.data.stopIds;
					itemData.parent = station;
					li.data = itemData;
					li.appendChild(a);
					li.appendChild(submenu);
					ul.appendChild(li);
				}
			});
		}

		function appendStations() {
			var ul = document.createElement('ul');
			var button = document.createElement('button');
			var menuWrapper = document.querySelector('#main-menu');
			menuWrapper.appendChild(button);
			menuWrapper.appendChild(ul);
			ul.className = 'menu';
			button.textContent = 'Open menu';
			button.addEventListener('click', toggleMenu);
			// Stations
			getStations().then(function(stations) {
				for (var stopCode in stations) {
					var li = document.createElement('li');
					var a = document.createElement('a');
					var submenu = document.createElement('ul');
					var stationData = {};
					stationData.stopCode = stopCode;
					stationData.stopIds = stations[stopCode].stopIds;
				}
			});
		}
