self.addEventListener('message', function(e) {
  var data = e.data;
  switch (data.cmd) {
    case 'start':
      self.postMessage('WORKER STARTED: ' + data.msg);
      break;
    case 'stop':
      self.postMessage('WORKER STOPPED: ' + data.msg);
      self.close(); // Terminates the worker.
      break;
    case 'parse':
      self.postMessage('PARSING STARTED: ' + data.msg);
      self.parseCSV(data.file, data.name, data.agent);
      break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  }
}, false);

self.parseCSV = function(file, name, agent) {
  $.getScript("./vendor/jquery.min.js")
    .done(function(script, textStatus) {
      $.getScript("./vendor/papaparse.min.js")
        .done(function(script, textStatus) {
          console.log(textStatus);
        })
        .fail(function(jqxhr, settings, exception) {
          console.log("worker script adding error line 26");
        });
    })
    .fail(function(jqxhr, settings, exception) {
      console.log("worker script adding error line 26");
    });

  // Parse CSV string
  if (file) {
    var data = Papa.parse(file);
    var feed = {
      name: name,
      data: data.data
    };
    fileArray[agent].json.push(feed);
    return;
  } else {
    console.log("No file presented");
  }
};
