var tf, lat, lng, zip, fileArray = [],
  dataArray = [];

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
    }, function(err) {
      console.log(err);
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
  //TODO add select handlers
  $('#agencies').on('change', function(e) {
    tf._addRoutes(e.target.value);
  });
}

var a_id = 0;
class Agency {
  constructor(files) {
    this.files = [files];
    this.json = [];
    this.id = a_id;
    a_id++;
  }
}

function getZip(url) {
  fileArray = [];
  fetch(url).then(function(response) {
    if (response.status === 200 || response.status === 0) {
      return Promise.resolve(response.arrayBuffer());
    }
  }).then(JSZip.loadAsync).then(function readfile(zip) {
    for (var file_name in zip.files) {
      var a;
      // If there is an agency file, create a new Agency object,
      // and store that agency file within it,
      // otherwise keep adding to the current Agency object.
      if (file_name == "agency.txt") {
        a = new Agency(zip.file(file_name).async('string'));
        fileArray.push(a);
      } else {
        // If an Agency object exists, add more files
        if (a) {
          a.files.push({
            name: file_name,
            file: zip.file(file_name).async('string')
          });
        } else {
          return;
        }
      }
    }
    return;
  });
}

function parseCSV(file, name, agent) {
  worker.postMessage({
    cmd:'parse',
    file: file,
    name: name,
    agent: agent
  });
}

var worker = new Worker('js/parseCSV.js');

worker.addEventListener('message', function(e) {
  console.log(e.data);
}, false);
