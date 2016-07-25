var ic = new IndexController(),
  idb = ic._openDatabase(),
  dbc = new DatabaseController(),
  taf, gtfs, stops = [],
  worker, currentTrips, currentStopTimes, tripType = "start";

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
        var start_button = $('<button class="row padded start_button">');
        var end_button = $('<button class="row padded end_button">');
        switch (tripType) {
          case 'start':
            //start times
            $('#times_table').append(
              start_button.text(formatTime(stop_data.stoptime.departure_time))
              .data('label', [stop_data.routeID, stop_data.stop.stop_name, stop_data.stoptime.departure_time])
              .data('elid', stop_data.stoptime.departure_time)
              .attr('id', stop_data.routeID)
            );
            $('.start_button').on('click', function(e) {
              var id = e.target.id;
              var data = $('#' + id).data('label')[0] + ' | ' + $('#' + id).data('label')[1] + ' ' + $('#' + id).data('label')[2];
              $('#departure_header').text(data);
            });
            break;
          case 'end':
            //start times
            $('#times_table').append(
              end_button.text(formatTime(stop_data.stoptime.departure_time))
              .data('label', [stop_data.routeID, stop_data.stop.stop_name, stop_data.stoptime.departure_time])
              .attr('id', stop_data.routeID)
            );
            end_button.on('click', function(e) {
              var id = e.target.id;
              var data = $('#' + id).data('label')[0] + ' | ' + $('#' + id).data('label')[1] + ' ' + $('#' + id).data('label')[2];
              $('#arrival_header').text(data);
            });
            break;
        }
      }
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
