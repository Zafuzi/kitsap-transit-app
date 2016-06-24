var GOOGLE_API_KEY = "AIzaSyDoXbsrpRCMR3Iwd-qSwVJmFfyEpFZvmqc";
var OTD_API_KEY = "6eda2aa3-7b7d-4fb6-8a42-3f6040b4b58a";

class Address {
  constructor(lat, lng) {
    this.lat = lat;
    this.lng = lng;
    this.dbPromise = new IndexController()._openDatabase();
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

  getRoutes() {
    var address = this;
    var url = 'http://api.pugetsound.onebusaway.org/api/where/stops-for-location/.json?key=' + OTD_API_KEY + '&lat=' + this.lat + '&lon=' + this.lng;
    var myHeaders = new Headers();

    var myInit = { method: 'GET',
                   headers: myHeaders,
                   mode: 'cors',
                   cache: 'default' };

    fetch(url, myInit)
      .then(function(response) {
        if (response.status == 200) {
          return response.json();
        }
      }).then(function(response) {
        console.log(response);
        var marker, option;
        if (response.data.list.length === 0) {
          address.lat = 47.6062;
          address.lng = -122.3321;
          address.getAddress();
          address.getRoutes();
        }
        $('#routes').html('');
        address.dbPromise.then(function(db){
          if(!db) return;
          var index = db.transaction('routes', 'readwrite')
          .objectStore('routes');
          response.data.list.map(function(data) {
            if (data.shortName.length === 0) {
              data.shortName = 0;
            }
            if (data.description.length === 0) {
              data.description = data.longName;
            }
            console.log(data.id);
            index.put(data);
            option = $('<option />');
            $(option).attr('value', data.id);
            $(option).text('(' + data.shortName + ') ' + data.description);
            $('#routes').append(option);
          });
        });
      })
      .catch(function(err) {
        console.log(err);
      });
  }

  getStopsForRoute(route) {
    var address = this;
    var url = 'http://api.pugetsound.onebusaway.org/api/where/stops-for-route/' + route + '/.json?key=' + OTD_API_KEY;
    fetch(url)
      .then(function(response) {
        return response.json();
      }).then(function(response) {
        clearMarkers();
        $('#stops').html('');
        console.log(response);
        response.data.entry.stopIds.map(function(stop) {
          address.getStopData(stop);
        });
      })
      .catch(function(err) {
        console.log(err);
      });
  }

  getStopData(stop_id) {
    var address = this;
    var url = 'http://api.pugetsound.onebusaway.org/api/where/stop/' + stop_id + '/.json?key=' + OTD_API_KEY;
    fetch(url)
      .then(function(response) {
        return response.json();
      }).then(function(response) {
        var stopLocation = {
          lat: response.data.entry.lat,
          lng: response.data.entry.lon
        };
        markers.push(new google.maps.Marker({
          map: map,
          position: stopLocation,
          title: response.data.entry.name
        }));
        // should add to DB first.
        address.dbPromise.then(function(db){
          if(!db) return;
          var index = db.transaction('stops', 'readwrite')
          .objectStore('stops');
          index.put(response.data.entry);
        });

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
