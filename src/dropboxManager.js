var
Dropbox = require('dropbox'),
request = require('request'),
dropbox_config = require('./config/dropbox');
q = require('q');

var dbClass = function() {
	this.headers = {
		"Authorization":"Bearer "+dropbox_config.token,
	};
};
dbClass.prototype.FILE_PUT_URL = 'https://api-content.dropbox.com/1/files_put/auto/'

dbClass.prototype.saveFile= function(file){
	var deferred = q.defer();
	var callback = function(error, response, body){
 		deferred.resolve({
 			e: error,
 			r: response,
 			b: body
 		});
 	}; 
	var uploadUrl = this.FILE_PUT_URL+ (file.path || file.name);
 	
var targetRequest = request.post({
  uri: uploadUrl,
  followRedirect: false, 
  headers: this.headers}, callback);

  file.stream.pipe(targetRequest);

  return deferred.promise;
};





module.exports = dbClass;