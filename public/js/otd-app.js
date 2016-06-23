var GOOGLE_API_KEY = "AIzaSyDoXbsrpRCMR3Iwd-qSwVJmFfyEpFZvmqc";
var OTD_API_KEY = "6eda2aa3-7b7d-4fb6-8a42-3f6040b4b58a";
class Address {
  constructor(lat, lng) {

    var self = this;

    this.lat = lat;
    this.lng = lng;
  }

  getAddress() {
    var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + this.lat + ',' + this.lng + '&key=' + GOOGLE_API_KEY;
    fetch(url).then(function(response) {
        if (response.status == 200) {
          return response.json();
        }
      })
      .then(function(json) {
        $('#route_header').text(json.results[0].formatted_address);
      })
      .catch(function(err) {
        console.log(err);
      });
  }

  getRoutes(parent) {
    var url = 'http://api.pugetsound.onebusaway.org/api/where/routes-for-location/.json?key=' + OTD_API_KEY + '&lat=' + this.lat + '&lon=' + this.lng;
    fetch(url)
      .then(function(response) {
        if (response.status == 200) {
          return response.json();
        }
      }).then(function(response) {
        var marker, option;
        console.log(response);
        if (response.data.list.length === 0) {
          parent.lat = 47.6062;
          parent.lng = -122.3321;
          parent.getAddress();
          parent.getRoutes(parent);
          console.log(self.lat);
        }
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

  getStopsForRoute(parent, route) {
    var url = 'http://api.pugetsound.onebusaway.org/api/where/stops-for-route/' + route + '/.json?key=' + OTD_API_KEY;
    fetch(url)
      .then(function(response) {
        return response.json();
      }).then(function(response) {
        clearMarkers();
        routeArray = [];
        response.data.entry.stopIds.map(function(stop) {
          parent.getStopData(stop);
        });
      })
      .catch(function(err) {
        console.log(err);
      });
  }

  getStopData(parent, stop_id) {
    var url = 'http://api.pugetsound.onebusaway.org/api/where/stop/' + stop_id + '/.json?key=6eda2aa3-7b7d-4fb6-8a42-3f6040b4b58a';
    fetch(url)
      .then(function(response) {
        return response.json();
      }).then(function(response) {
        lat = response.data.entry.lat;
        lon = response.data.entry.lon;
        var location = {
          lat: lat,
          lng: lon
        };
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
}
