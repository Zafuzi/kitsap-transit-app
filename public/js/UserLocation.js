class UserLocation {
  constructor(lat, lng) {
    this.lat = lat;
    this.lng = lng;

    console.log(lat);
  }

  _getLat(){
    return this.lat;
  }

  _getLng(){
    return this.lng;
  }
}
