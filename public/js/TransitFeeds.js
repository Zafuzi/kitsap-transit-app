class TransitFeeds {
  constructor(lat, lng){
    this.API_KEY = '52e4e299-2140-4d5b-b817-0121bef93d58';
    this.lat = lat;
    this.lng = lng;
  }
  _getFeeds(){
    var self = this;
    var loc = self.lat + "," + self.lng;
    var feedsURL = 'https://api.transitfeeds.com/v1/getFeeds&key=' + this.API_KEY + '&location=66';
    fetch(feedsURL).then(function (response) {
      return response.json();
    }).then(function (data) {
      console.log(data);
    });
  }
  _getLocations(){
      var self = this;
      var loc = self.lat + "," + self.lng;
      var maxLat = self.lat + 0.05;
      var minLat = self.lat - 0.05;
      console.log(maxLat);
      console.log(minLat);
      var total = 0;
      var feedsURL = 'https://api.transitfeeds.com/v1/getLocations&key=' + this.API_KEY;
      fetch(feedsURL).then(function (response) {
        return response.json();
      }).then(function (data) {
        data.results.locations.map(function(feed){
          if(feed.lat <= maxLat && feed.lat >= minLat){
            console.log(feed);
            total++;
            console.log(total);
          }
        });
      });
  }
}
