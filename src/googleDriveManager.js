var
request = require('request'),
q = require('q'),
URLManager = require('./utils/urlManager'),
_= require('underscore'),
cheerio = require('cheerio');





var GoogleDriveManager = function() {};

GoogleDriveManager.prototype.getSpreadsheetsById = function(id){
var deferred =q.defer(); 
var url= 'https://docs.google.com/spreadsheets/d/'+id+'/gviz/tq';
request({uri: url, followRedirect: true}, function(e,r,b){
var jsonString = b.substr(39,b.length-39-2);
var scheet = (JSON.parse(jsonString));
var result = [];
_.each(scheet.table.rows, function(row){
	var episodeObject = {
		number: row.c[0] && row.c[0].v,
		links: {}
	};	
	
_.each(row.c, function(td, i){
	if(!td || !td.v || i == 0)return;
	var link = td.v;
	var cloudService = URLManager.getCloudServiceByURL(link);
	if(cloudService){
		episodeObject.links[cloudService] = link;
	}
});
result.push(episodeObject);
// result.push({
// 	episode: row.c[0] && row.c[0].v,
// 	zsLink: (row.c[2])?row.c[2].v:null
// });
});


deferred.resolve(result);
});
return deferred.promise;
};

module.exports = GoogleDriveManager;