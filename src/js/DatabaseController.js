class DatabaseController {
  _getIndexedData() {
    var self = this;
    self.routes = taf({
      name: 'routes'
    });
    self.trips = taf({
      name: 'trips'
    });
    self.stoptimes = taf({
      name: 'stop_times'
    }).first().data;
    self.stops = taf({
      name: 'stops'
    }).first().data;
    self.calendar = taf({
      name: 'calendar'
    });
    self.transfers = taf({
      name: 'transfers'
    });
  }
  _findTripsForRoute(routeID) {
    var self = this;
    var keys = self.trips.first().data
      .map((trip, key) => {
        if (trip[0].route_id == routeID && trip[0].service_id == serviceDates()) {
          return trip[0].trip_id;
        }
      }).filter(n => {
        return n != undefined;
      });
    return keys;
  }
  _findStopTimesForTrip(tripID) {
    var self = this;
    var stops = self.stoptimes.filter(n => {
      return (n[0].trip_id == tripID) ? n[0] : undefined;
    }).filter(n => {
      return n != undefined;
    });
    return stops;

  }
  _getStop(stopID) {
    var self = this;
    var stops = self.stops.filter(n => {
      return (n[0].stop_id == stopID) ? n[0] : undefined;
    }).filter(n => {
      return n != undefined;
    });
    return stops;
  }
}
