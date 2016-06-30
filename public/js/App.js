var tf, map, lat, lng;

  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(setLocation);
      console.log(lat);
    } else {
      console.log("No support");
    }
  }

  function setLocation(position) {
    lat = position.coords.latitude;
    lng = position.coords.longitude;
    startApp();
  }

  function startApp() {
    tf = new TransitFeeds();
    map = new Map(lat, lng);
    map._initMap();
  }

  $(function() {
    getLocation();
    addHandlers();
  });


  function addHandlers() {
    $('#search-toggle').click(function() {
      console.log("clicked");
    });
    $('.menu-toggle').click(function() {
      toggleSidebar();
    });

    $('.yes-destination').click(function(){

    });
  }

  function toggleSidebar(){
    $('.navbar').animate({
      'margin-left': $('.navbar').css('margin-left') == '0px' ? '-210px' : '0px'
    }, 500);
    $('.map-container').animate({
      'margin-left': $('.map-container').css('margin-left') == '0px' ? '210px' : '0px'
    }, 500);
  }
