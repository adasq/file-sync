var GoogleDriveManager = require('./googleDriveManager'),
q= require('q');

var EpisodeManager = function(){
	this.googleDriveManager = new GoogleDriveManager();
}
EpisodeManager.prototype.getEpisodesByArtist = function(artist){
	return this.googleDriveManager.getSpreadsheetsById(artist.spreadsheetId);
};

EpisodeManager.prototype.getLatestEpisodeByArtist = function(artist){
	var deferred = q.defer(); 
	episodesPromise = this.googleDriveManager.getSpreadsheetsById(artist.data.spreadsheetId);
	episodesPromise.then(function(episodes){
		var latestEpisode = episodes[episodes.length-1];
		if(latestEpisode){
			deferred.resolve(latestEpisode);
		}else{
			deferred.reject();
		}
	});
	return deferred.promise;	
};


module.exports = EpisodeManager;