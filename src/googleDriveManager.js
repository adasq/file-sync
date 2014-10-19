var
request = require('request'),
q = require('q'),
_= require('underscore'),
cheerio = require('cheerio');


var map = {
	artists: [
	{name: 'hardwell', id:'1afQOtEpRYDn1F130M8uhPueOae-shobGR04LDO-pAfo'},
	{name: 'tiesto', id:'1-BztOm4fY7o-Liv-dqY7vCbpw5EALvEWLmkY1ZRBeiI'},
	
	]
};

var getDriveDocumentIdByArtistName = function(artistName){
	var artist =  _.find(map.artists, function(artist){
	return artist.name === artistName;
});

	if(artist){
		return artist.id
	}else{
		return null;
	}
};


var GoogleDriveManager = function() {
};

GoogleDriveManager.prototype.getByArtist = function(artistName){
var deferred =q.defer();
var artistId = getDriveDocumentIdByArtistName(artistName);
var url= 'https://docs.google.com/spreadsheets/d/'+artistId+'/gviz/tq';
request({uri: url, followRedirect: true}, function(e,r,b){
var jsonString = b.substr(39,b.length-39-2);
var scheet = (JSON.parse(jsonString));
var result = [];
_.each(scheet.table.rows, function(row){
result.push({
	episode: row.c[0].v,
	zsLink: (row.c[2])?row.c[2].v:null
})
});
deferred.resolve(result);
});
return deferred.promise;
};

module.exports = GoogleDriveManager;