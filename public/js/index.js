$(function() {
  geoLocate();
});

var transitArray = [],
  markers = [],
  routeArray = [],
  userLocation;

/**
 * NOTE this really needs some work, calling evertything here is going to end up
 * forcing me to make a huge function that will block offline processes.
 * Consider moving them to the indexController or some other class for easier integration.
 * That way this file can be used solely for online functions.
 */
function geoLocate() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function(position) {
      // assign a new address class to userLocation using current location
      // uses default seattle location if there is no route data nearby
      userLocation = new Address(position.coords.latitude, position.coords.longitude);
      userLocation.getAddress();
      userLocation.getRoutes(userLocation);

      $('#routes').change(function(e) {
        var option = $(this).find(':selected').val();
        userLocation.getStopsForRoute(userLocation, option);
      });

      $('#stops').change(function(e) {
        var option = $(this).find(':selected').val();
        userLocation.getStopData(userLocation, option);
      });

      getGoogleMapsApi(userLocation.lat, userLocation.lng);

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
    });
  } else {
    getGoogleMapsApi(47.6062, -122.3321);
  }
}

function getGoogleMapsApi(lat, lon) {
  $.getScript('https://maps.googleapis.com/maps/api/js?key=' + GOOGLE_API_KEY + '&libraries=places')
    .done(function(script, textStatus) {
      console.log(textStatus);
      var gMap = new GoogleMap(lat, lon);
    })
    .fail(function(jqxhr, settings, exception) {
      $("div.log").text("Triggered ajaxError handler.");
    });
}

// function initMap(lat, lon) {
//   map = new google.maps.Map($('#map')[0], {
//     center: {
//       lat: lat,
//       lng: lon
//     },
//     zoom: 15
//   });
//
//   // Create the search box and link it to the UI element.
//   var input = $('#start-input')[0];
//   var searchBox = new google.maps.places.SearchBox(input);
//
//   // Bias the SearchBox results towards current map's viewport.
//   map.addListener('bounds_changed', function() {
//     searchBox.setBounds(map.getBounds());
//   });
//
//   markers = [];
//   searchBox.addListener('places_changed', function() {
//     var places = searchBox.getPlaces();
//     if (places.length === 0) {
//       return;
//     }
//     // Clear out the old markers.
//     clearMarkers();
//
//     // For each place, get the icon, name and location.
//     var bounds = new google.maps.LatLngBounds();
//     places.forEach(function(place) {
//       var icon = {
//         url: place.icon,
//         size: new google.maps.Size(71, 71),
//         origin: new google.maps.Point(0, 0),
//         anchor: new google.maps.Point(17, 34),
//         scaledSize: new google.maps.Size(25, 25)
//       };
//       userLocation.getRoutes(place.geometry.location.lat(), place.geometry.location.lng());
//       markers.push(new google.maps.Marker({
//         map: map,
//         icon: icon,
//         title: place.name,
//         position: place.geometry.location
//       }));
//
//       if (place.geometry.viewport) {
//         // Only geocodes have viewport.
//         bounds.union(place.geometry.viewport);
//       } else {
//         bounds.extend(place.geometry.location);
//       }
//     });
//     map.fitBounds(bounds);
//   });
// }

function clearMarkers() {
  markers.forEach(function(marker) {
    marker.setMap(null);
  });
  markers = [];
}
// TODO get the stop schedule, allow the user to search for a stop
