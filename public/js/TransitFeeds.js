class TransitFeeds {
  constructor(lat, lng){
    this.API_KEY = '52e4e299-2140-4d5b-b817-0121bef93d58';
    this.feedsURL = 'https://api.transitfeeds.com/v1/getFeeds&key=' + this.API_KEY;
    this.lat = lat;
    this.lng = lng;
  }
  _getFeeds(){
    var self = this;
    fetch(self.feedsURL).then(function (response) {
      return response.json();
    }).then(function (data) {
      console.log(data);
    });
  }
}
