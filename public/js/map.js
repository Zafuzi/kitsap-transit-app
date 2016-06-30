class Map {
  constructor(lat, lng) {
    this.lat = lat;
    this.lng = lng;
  }

  _initMap() {
    var self = this;
    L.mapbox.accessToken = 'pk.eyJ1IjoiemFmdXppIiwiYSI6ImNpcHVlMzZpczBjeDVmdm0yZXkwano0MTEifQ.IaYNAY6iPj0xLmAXTO5RmA';

    map = L.mapbox.map('map', 'mapbox.streets')
      .setView([
        self.lat, self.lng
      ], 9);


    var GooglePlacesSearchBox = L.Control.extend({
      onAdd: function() {
        var container = $('<div class="row search-container">');
        var menu = $('<a href="#" class="menu-toggle pull-left" onclick="toggleSidebar()" id="search-toggle"><i class="material-icons">menu</i></a>');
        var element = document.createElement("input");
        element.id = "searchBox";
        $(element).attr('type', 'text');
        $(element).attr('placeholder', 'Destination');

        container.append(menu);
        container.append(element);
        return container[0];
      }
    });
    var sb = new GooglePlacesSearchBox();
    sb.addTo(map);

    var input = document.getElementById("searchBox");
    var searchBox = new google.maps.places.SearchBox(input);

    searchBox.addListener('places_changed', function() {
      var places = searchBox.getPlaces();
      if (places.length === 0) {
        return;
      }
      console.log(places);
      var group = L.featureGroup();
      places.forEach(function(place) {
        var marker = L.marker([
          place.geometry.location.lat(),
          place.geometry.location.lng()
        ]);
        group.addLayer(marker);
        var popupContent = $('<div class="row text-center popup-content">');
        $(popupContent).append('<h5>' + place.name + '</h5>');
        $(popupContent).append('<p>Is this right?</p>');
        $(popupContent).append('<button class"yes-destination col-12">Yes</button>');
        $(popupContent).append('<button class"no-destination col-12">No</button>');
        console.log(place);
        tf.lat = place.geometry.location.lat();
        tf.lng = place.geometry.location.lng();

        tf._getLocations();
        var popup = L.popup()
          .setLatLng(marker._latlng)
          .setContent(popupContent[0])
          .openOn(map);

        marker.bindPopup(popup);
      });
      group.addTo(map);
      map.fitBounds(group.getBounds());
    });
  }
}
