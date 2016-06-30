class TransitFeeds {
  constructor(lat, lng) {
    this.API_KEY = '52e4e299-2140-4d5b-b817-0121bef93d58';
    this.lat = lat;
    this.lng = lng;
  }
  _getLocations() {
    var self = this;
    var maxLat = self.lat + 0.15;
    var minLat = self.lat - 0.15;
    var maxLng = self.lng + 0.15;
    var minLng = self.lng - 0.15;

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
    var feedsURL = 'https://api.transitfeeds.com/v1/getFeeds&key=' + this.API_KEY + '&location=' + id;
    fetch(feedsURL).then(function(response) {
      return response.json();
    }).then(function(data) {
      console.log(data);
      data.results.feeds.map(function(feed) {
        self._getLatestFeedVersion(feed.id);
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
        if(response.status === 500){
          console.log(response);
        }
      }).then(function(url) {
        if(url){
          getZip(url);
        }
      })
      .catch(function(err) {
        console.log(err);
      });
  }
  _getAgencies(){
    dataArray.map(function(i){
      if(i.name == "agency.txt"){
        var option = $('<option>');
        option.value = i.data[1][1];
        $(option).text(i.data[1][1]);
        console.log(option);
        $('#u-search').append(option);
      }
    });
  }
}
