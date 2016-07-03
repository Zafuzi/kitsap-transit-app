class TransitFeeds {
  constructor(lat, lng) {
    this.API_KEY = '52e4e299-2140-4d5b-b817-0121bef93d58';
    this.lat = lat;
    this.lng = lng;
  }
  _getLocations() {
    var self = this;
    var maxLat = self.lat + 0.05;
    var minLat = self.lat - 0.05;
    var maxLng = self.lng + 0.05;
    var minLng = self.lng - 0.05;

    var feedsURL = 'https://api.transitfeeds.com/v1/getLocations&key=' + this.API_KEY;
    fetch(feedsURL).then(function(response) {
      return response.json();
    }).then(function(data) {
      data.results.locations.map(function(feed) {
        if (feed.lat <= maxLat && feed.lat >= minLat && feed.lng <= maxLng && feed.lng >= minLng) {
          console.log(feed);
          self._getFeeds(feed.id);
        }
      });
    });
  }
  _getFeeds(id) {
    var self = this;
    var loc = self.lat + "," + self.lng;
    console.log(id);
    var feedsURL = 'https://api.transitfeeds.com/v1/getFeeds&key=' + this.API_KEY + '&location=' + id + '&page=1';
    fetch(feedsURL).then(function(response) {
      return response.json();
    }).then(function(data) {
      data.results.feeds.map(function(feed) {
        if (feed.latest) {
          self._getLatestFeedVersion(feed.id);
        }
      });
    });
  }
  _getLatestFeedVersion(id) {
    var self = this;
    var loc = self.lat + "," + self.lng;
    var feedsURL = 'https://api.transitfeeds.com/v1/getLatestFeedVersion&key=' + this.API_KEY + '&feed=' + id;
    fetch(feedsURL).then(function(response) {
        if (response.status === 200) {
          return response.url;
        }
        if (response.status === 500) {
          console.log(response);
        }
      }).then(function(url) {
        console.log(url);
        if (url) {
          getZip(url);
        }
      })
      .catch(function(err) {
        console.log(err);
      });
  }
  _getAgencies() {
      var self = this;
      var agent = -1;
      fileArray.map(function(agency) {
        agency.files.map(function(key, f) {
          if (f === 0) {
            console.log(f);
            agent++;
            parseCSV(key._result, "agency.txt", agent);
          } else {
            if (key.file) {
              parseCSV(key.file._result, key.name, agent);
            }
          }
        });
      });
      return Promise.resolve().then(self._addAgencies());
    }
    // adds agencies to the select element on the page
  _addAgencies() {
    var self = this;
    var option;
    $('#agencies').html('');

    fileArray.map(function(agency) {
      option = $('<option>');
      var name = agency.json[0].data[1][1];
      $(option).val(agency.id);
      $(option).text(name);
      $('#agencies').append(option);
    });
    self._addRoutes(-1);
    return;
  }
  _addRoutes(id) {
    var self = this;
    var agency;
    if (id === -1) {
      fileArray.map(function(v, k) {
        self._routeAdder(k);
      });
    } else {
      self._routeAdder(id);
    }
  }

  _routeAdder(id) {
    var self = this;
    var option;
    $('#routes').html('');
    var agency = fileArray[id];

    var name;

    agency.json.map(function(f) {
      if (f.name == "routes.txt") {
        f.data.map(function(route, key) {
          //catch empty route
          if (!route || route.length < 1) return;
          //ignore first index (it's just for describing the rest of the data)
          if (key === 0) return;
          //catch empty route id and description
          if (!route[2] || !route[4]) {
            return;
          } else {
            var route_long_name = '' + route[2] + ' ' + route[4] + '';
            //remove any undefined data that may have slipped by
            if (route_long_name == "undefined undefined") {
              return;
            } else {
              //TODO index the routes and agencies for on demand data
              option = $('<option>');
              option.value = route_long_name;
              $(option).text(route_long_name);
              $('#routes').append(option);
            }
          }
          return;
        });
      }
      //default data if no data. Changes if data is found
      var $datalist = $('#routes');
      if ($datalist.html().length < 1) {
        $('#routes-input').attr('Placeholder', 'No data was found');
      } else {
        $('#routes-input').attr('Placeholder', 'Select a route');
      }

    });
  }
}
