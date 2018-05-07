/**
 * FileTransferError
 * @constructor
 */
var FileTransferError = function (code, source, target, status, body, exception) {
  this.code = code || null;
  this.source = source || null;
  this.target = target || null;
  this.http_status = status || null;
  this.body = body || null;
  this.exception = exception || null;
};

FileTransferError.FILE_NOT_FOUND_ERR = 1;
FileTransferError.INVALID_URL_ERR = 2;
FileTransferError.CONNECTION_ERR = 3;
FileTransferError.ABORT_ERR = 4;
FileTransferError.NOT_MODIFIED_ERR = 5;

module.exports = FileTransferError;