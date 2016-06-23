$(function() {
  geoLocate();

  $('#routes').change(function(e) {
    var option = $(this).find(':selected').val();
    getStopsForRoute(option);
  });
});

var transitArray = [],
  markers = [],
  routeArray = [];

function geoLocate() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function(position) {
      //getGoogleMapsApi(position.coords.latitude, position.coords.longitude);
      getGoogleMapsApi(47.6062, -122.3321);
      $('#start-input').attr('placeholder', "Your Location");
    }, function(err) {
      switch (err) {
        case 1:
          //TODO ask for permission again
          console.log("Position Denied");
          break;
        case 2:
          // TODO decalre GPS failure
          console.log("Position unavailable");
          break;
      }
      $('#start-input').attr('placeholder', "Seattle, Wa");
      getGoogleMapsApi(47.6062, -122.3321);
    });
  } else {
    getGoogleMapsApi(47.6062, -122.3321);
  }
}

function getGoogleMapsApi(lat, lon) {
  $.getScript('https://maps.googleapis.com/maps/api/js?key=AIzaSyB01QCwQJ8u1CO3pW25Any9I0YgEdBuyEA&libraries=places')
    .done(function(script, textStatus) {
      console.log(textStatus);
      initMap(lat, lon);
    })
    .fail(function(jqxhr, settings, exception) {
      $("div.log").text("Triggered ajaxError handler.");
    });
}

var map;

function initMap(lat, lon) {
  map = new google.maps.Map($('#map')[0], {
    center: {
      lat: lat,
      lng: lon
    },
    zoom: 15
  });

  // Create the search box and link it to the UI element.
  var input = $('#start-input')[0];
  var searchBox = new google.maps.places.SearchBox(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

  markers = [];
  getLocation(lat, lon);
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();
    if (places.length === 0) {
      return;
    }
    // Clear out the old markers.
    clearMarkers();

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };
      getLocation(place.geometry.location.lat(), place.geometry.location.lng());
      markers.push(new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
      }));

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
  });
}

function getLocation(lat, lon) {
  url = 'http://api.pugetsound.onebusaway.org/api/where/routes-for-location/.json?key=6eda2aa3-7b7d-4fb6-8a42-3f6040b4b58a&lat=' + lat + '&lon=' + lon;
  fetch(url)
    .then(function(response) {
      if (response.status == 200) {
        return response.json();
      }
    }).then(function(response) {
      var marker, option;
      console.log(response);
      $('#routes').html('');
      response.data.list.map(function(data) {
        console.log(data);
        if (data.shortName.length === 0) {
          data.shortName = 0;
        }
        if (data.description.length === 0) {
          data.description = data.longName;
        }
        option = $('<option />');
        $(option).attr('value', data.id);
        $(option).text('(' + data.shortName + ') ' + data.description);
        $('#routes').append(option);
      });
    })
    .catch(function(err) {
      console.log(err);
    });
}

function getStopsForRoute(route) {
  url = 'http://api.pugetsound.onebusaway.org/api/where/stops-for-route/' + route + '/.json?key=6eda2aa3-7b7d-4fb6-8a42-3f6040b4b58a';
  fetch(url)
    .then(function(response) {
      return response.json();
    }).then(function(response) {
      clearMarkers();
      routeArray = [];
      response.data.entry.stopIds.map(function(stop) {
        getStopData(stop);
      });
    })
    .catch(function(err) {
      console.log(err);
    });
}

var lat, lon;

function getStopData(stop_id) {
  url = 'http://api.pugetsound.onebusaway.org/api/where/stop/' + stop_id + '/.json?key=6eda2aa3-7b7d-4fb6-8a42-3f6040b4b58a';
  fetch(url)
    .then(function(response) {
      return response.json();
    }).then(function(response) {
      lat = response.data.entry.lat;
      lon = response.data.entry.lon;
      var location = {lat: lat, lng: lon};
      markers.push(new google.maps.Marker({
        map: map,
        position: location,
        title: response.data.entry.name
      }));
      routeArray.push(response);

      var option = $('<option />');
      $(option).attr('value', response.data.entry.id);
      $(option).text('(' + response.data.entry.code + ') ' + response.data.entry.name);
      $('#stops').append(option);
    })
    .catch(function(err) {
      console.log(err);
    });
}

function clearMarkers() {
  markers.forEach(function(marker) {
    marker.setMap(null);
  });
  markers = [];
}


// TODO get the stop schedule, allow the user to search for a stop, and make the map not suck dick.
