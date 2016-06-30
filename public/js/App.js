var tf, lat, lng, zip, fileArray=[], dataArray=[];

$(function() {
  getLocation();
  addHandlers();
});

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      lat = position.coords.latitude;
      lng = position.coords.longitude;
      startApp();
    });

  } else {
    console.log("No support");
  }
}

function startApp() {
  tf = new TransitFeeds(lat, lng);
  tf._getLocations();
}

function addHandlers() {
  $('.menu-toggle').click(function() {
    toggleSidebar();
  });
}

function getZip(url) {
  fileArray = [];
  fetch(url).then(function(response) {
    if (response.status === 200 || response.status === 0) {
      return Promise.resolve(response.arrayBuffer());
    }
  }).then(JSZip.loadAsync).then(function readfile(zip) {
    for(var file in zip.files){
      fileArray.push({name: file, file: zip.file(file).async('string')});
    }
    return Promise.resolve(readfile);
  }).then(function(){
    fileArray.map(function(f){
      if(f.file._result){
        parseCSV(f.file._result, f.name);
      }
    });
  });
}


function parseCSV(file, name) {
  // Parse CSV string
  new Promise(function(resolve, err) {
    if(file){
      var data = Papa.parse(file);
      var feed = {name: name, data: data.data};
      dataArray.push(feed);
    }
  }).then(function(){
    return Promise.resolve();
  }).catch(function(err){
    console.log(err);
  });
}
