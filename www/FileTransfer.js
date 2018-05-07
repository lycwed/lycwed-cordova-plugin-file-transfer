function getUrlCredentials(urlString) {
  var credentialsPattern = /^https?\:\/\/(?:(?:(([^:@\/]*)(?::([^@\/]*))?)?@)?([^:\/?#]*)(?::(\d*))?).*$/,
    credentials = credentialsPattern.exec(urlString);

  return credentials && credentials[1];
}

function getBasicAuthHeader(urlString) {
  var header = null;

  if (window.btoa) {
    var credentials = getUrlCredentials(urlString);
    if (credentials) {
      var authHeader = "Authorization";
      var authHeaderValue = "Basic " + window.btoa(credentials);

      header = {
        name: authHeader,
        value: authHeaderValue
      };
    }
  }

  return header;
}

function convertHeadersToArray(headers) {
  var result = [];
  for (var header in headers) {
    if (headers.hasOwnProperty(header)) {
      var headerValue = headers[header];
      result.push({
        name: header,
        value: headerValue.toString()
      });
    }
  }
  return result;
}

var idCounter = 0;

/**
 * FileTransfer uploads a file to a remote server.
 * @constructor
 */
var FileTransfer = function () {
  this._id = ++idCounter;
  this.reader = null;
  this.onprogress = null; // optional callback
};

/**
 * Given an absolute file path, uploads a file on the device to a remote server
 * using a multipart HTTP request.
 * @param filePath {String}           Full path of the file on the device
 * @param server {String}             URL of the server to receive the file
 * @param successCallback (Function}  Callback to be invoked when upload has completed
 * @param errorCallback {Function}    Callback to be invoked upon error
 * @param options {FileUploadOptions} Optional parameters such as file name and mimetype
 * @param trustAllHosts {Boolean} Optional trust all hosts (e.g. for self-signed certs), defaults to false
 */
FileTransfer.prototype.upload = function (filePath, server, successCallback, errorCallback, options, trustAllHosts) {
  var basicAuthHeader = getBasicAuthHeader(server);
  if (basicAuthHeader) {
    server = server.replace(getUrlCredentials(server) + '@', '');

    options = options || {};
    options.headers = options.headers || {};
    options.headers[basicAuthHeader.name] = basicAuthHeader.value;
  }

  if (options) {
    mimeType = options.mimeType;
    httpMethod = options.httpMethod || "POST";
    if (httpMethod.toUpperCase() == "PUT") {
      httpMethod = "PUT";
    } else {
      httpMethod = "POST";
    }
  }

  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
    console.log('file system open: ' + fs.name);
    fs.root.getFile(filePath, {
      create: true,
      exclusive: false
    }, function (fileEntry) {
      fileEntry.file(function (file) {
        this.reader = new FileReader();
        this.reader.onloadend = function () {
          var blob = new Blob([new Uint8Array(this.result)], {
            type: options.mimeType
          });
          var oReq = new XMLHttpRequest();
          oReq.open(httpMethod, server, true);
          oReq.onload = function (oEvent) {
            successCallback();
          };
          oReq.send(blob);
        };

        this.reader.onprogress = function (e) {
          if (evt.lengthComputable) {
            if (self.onprogress) {
              self.onprogress({
                loaded: evt.loaded,
                total: evt.total
              });
            }
          }
        };

        this.reader.readAsArrayBuffer(file);
      }, function (e) {
        var error = 'error getting fileentry file!' + e;
        console.error(error);
        errorCallback(error);
      });
    }, function (e) {
      var error = 'error getting file! ' + e;
      console.error(error);
      errorCallback(error);
    });
  }, function (e) {
    var error = 'error getting persistent fs! ' + e;
    console.error(error);
    errorCallback(error);
  });
};

/**
 * Downloads a file form a given URL and saves it to the specified directory.
 * @param source {String}          URL of the server to receive the file
 * @param target {String}         Full path of the file on the device
 * @param successCallback (Function}  Callback to be invoked when upload has completed
 * @param errorCallback {Function}    Callback to be invoked upon error
 * @param trustAllHosts {Boolean} Optional trust all hosts (e.g. for self-signed certs), defaults to false
 * @param options {FileDownloadOptions} Optional parameters such as headers
 */
FileTransfer.prototype.download = function (source, target, successCallback, errorCallback, trustAllHosts, options) {
  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
    console.log('file system open: ' + fs.name);
    fs.root.getFile(source, {
      create: true,
      exclusive: false
    }, function (fileEntry) {
      console.log('fileEntry is file? ' + fileEntry.isFile.toString());
      var oReq = new XMLHttpRequest();
      oReq.open("GET", target, true);
      oReq.responseType = "blob";
      oReq.onload = function (oEvent) {
        var blob = oReq.response;
        if (blob) {
          this.reader = new FileReader();
          this.reader.addEventListener("loadend", function () {
            successCallback();
          });
          this.reader.addEventListener("progress", function (e) {
            if (evt.lengthComputable) {
              if (self.onprogress) {
                self.onprogress({
                  loaded: evt.loaded,
                  total: evt.total
                });
              }
            }
          });
          this.reader.readAsText(blob);
        } else {
          var error = 'we didnt get an XHR response!';
          console.error(error);
          errorCallback(error);
        }
      };
      oReq.send(null);
    }, function (err) {
      var error = 'error getting file! ' + err;
      console.error(error);
      errorCallback(error);
    });
  }, function (err) {
    var error = 'error getting persistent fs! ' + err;
    console.error(error);
    errorCallback(error);
  });
};

/**
 * Aborts the ongoing file transfer on this object. The original error
 * callback for the file transfer will be called if necessary.
 */
FileTransfer.prototype.abort = function () {
  this.reader.abort();
};

module.exports = FileTransfer;