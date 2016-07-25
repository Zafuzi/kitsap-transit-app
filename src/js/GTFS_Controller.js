class GTFS_Controller {
  constructor(zip_name){
    this.zip = this._getZip(zip_name);
  }
  _getZip(url){
    return fetch(url).then(function(response) {
      if (response.status === 200 || response.status === 0) {
        return Promise.resolve(response.arrayBuffer());
      }
    });
  }
  _getFilesFromZip(zip_obj){
    var self = this;
    var data = [];
    for (var file in zip_obj.files) {
      data.push({
        name: file,
        data: zip_obj.file(file).async('string')
      });
    }
    return new Promise(function(resolve, reject) {
      if (data) {
        resolve(data);
      } else {
        reject(data);
      }
    }).then(console.log("Files Returned"));
  }
  _parseCSVFromFiles(zip_obj){
    var self = this;
    return self._getFilesFromZip(zip_obj).then(files => {
      files.map(file => {
        var data = file.data._result;
        if (data) {
          var wrapArray = [];
          Papa.parse(data, {
            worker: false,
            header: true,
            step: results => {
              wrapArray.push(results.data);
            }
          });
          idb.then(db => {
            const tx = db.transaction('text-files', 'readwrite')
              .objectStore('text-files').put({
                name: file.name.split('.')[0],
                data: wrapArray
              });
            return tx.complete;
          });
        } else {
          console.log("There was an error processing some of the files");
        }
      });
    });
  }
}
