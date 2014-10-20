var
express = require('express'),
request = require('request'),
progress = require('request-progress'),
q = require('q'),
_= require('underscore'),
util = require('util'),
  vm = require('vm'),
fs = require('fs'),
URLManager = require('./utils/urlManager'),
CloudService = require('./utils/cloudService'),
cheerio = require('cheerio'),
GoogleDriveManager = require('./googleDriveManager'),
ZippyShareDriver = require('./drivers/zippyShareDriver'),
Mp3LiDriver = require('./drivers/mp3liDriver'),
DropboxManager = require('./dropboxManager'),
db = require('./db/connect');

 var zippyDriver = new ZippyShareDriver();
 var dbManager = new DropboxManager(); 
 var googleDriveManager = new GoogleDriveManager();


//=====================================================================================
var MongoModel = function(){};
MongoModel.prototype._db = db; 
//--------------------------
MongoModel.prototype.getAll = function(){
	var that=this, deferred = q.defer();

  db.Artists.find().exec(function(err, artists){
  	if(!err){
  		artists = _.map(artists, function(artistData){
  			var artist = new that._constructor();
  			artist.data = artistData;
  			return artist;
  		});
  		deferred.resolve(artists);
  	}else{
  		deferred.reject(err);
  	}
});
  return deferred.promise;
};
//--------------------------
MongoModel.prototype.save = function(){
	var that=this, deferred = q.defer(); 
	if(this.data._id){
		console.log('updating')
		//update
		 this.data.save(function(err, artist){
		  	if(!err){ 
		  		that.data = artist;
		  		deferred.resolve();
		  	}else{
		  		deferred.reject(err);
		  	}
		});		
	}else{
		console.log('save!!!')
	}
  return deferred.promise;
};
//=====================================================================================
var Artist = function(data){
  this.data = data || {};
  this._constructor = Artist;
  this._mongoCollection = 'Artists';
};
Artist.prototype = MongoModel.prototype;

//EpisodeManager =========================================================================
var EpisodeManager = function(){
	this.googleDriveManager = new GoogleDriveManager();
}
EpisodeManager.prototype.getEpisodesByArtist = function(artist){
	return googleDriveManager.getSpreadsheetsById(artist.spreadsheetId);
};

EpisodeManager.prototype.getLatestEpisodeByArtist = function(artist){
	var deferred = q.defer(); 
	episodesPromise = googleDriveManager.getSpreadsheetsById(artist.data.spreadsheetId);
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
//========================================================================================

var episodeManager = new EpisodeManager();
var artist = new Artist();

var getEpisodeReportByArtist = function(artist){
		var deferred = q.defer();
		var response = {
			artist: artist,
			error: true
		};
		var latestEpisodePromise = episodeManager.getLatestEpisodeByArtist(artist);
		latestEpisodePromise.then(function(latestEpisode){ 
			if(latestEpisode.number > artist.data.lastEpisode){				
				 if(latestEpisode.links[CloudService.ZIPPYSHARE]){
						var latestEpisodeLink = latestEpisode.links[CloudService.ZIPPYSHARE];														
							deferred.resolve(_.extend(response, {error: false, link: latestEpisodeLink ,episode: latestEpisode}));							
				 }else{
				 	response.message = 'not available for zippy :(';
				 	deferred.resolve(response);
				 }
			}else{	
				response.message = 'no episode available';
				deferred.resolve(response);
			}
		}); 
		return deferred.promise;
};


var getEDMTunesReport = function(){
	var deferred = q.defer();
	artist.getAll().then(function(artists){
	var reportPromises = [];
	_.each(artists, function(artist){		
		//var episodesPromise = episodeManager.getEpisodesByArtist(artist);
		// episodesPromise.then(function(episodes){
		// 	console.log(episodes);
		// });
		reportPromises.push(getEpisodeReportByArtist(artist));

		//artist.data.lastEpisode--;
		// artist.save().then(function(){
		// 	console.log(artist)
		// });

		// artist.lastEpisode++;
		// artist.save(function(err, model){
		// 	if(!err){
		// 		console.log(model)
		// 	}
		// });

	});
	q.all(reportPromises).then(function(reports){
		deferred.resolve(reports)
	});
});//artistPromise
return deferred.promise;
};


getEDMTunesReport().then(function(reports){
	_.each(reports, function(report){
			if(report.error){
				console.log(report.artist.data.name+": "+report.message)
			}else{
				console.log(report.artist.data.name+": "+report.link);
				// downloadFileByUrlAndDriver(latestEpisodeLink, zippyDriver).then(function(result){
							// 	console.log(result.b)
							// });
			}
			console.log('=======================');
		});
})



// var promise = getLatestEpisodeByArtist('doorn');
// promise.then(function(latestEpisode){
// if(latestEpisode.links[CloudService.ZIPPYSHARE]){
// 		var latestEpisodeLink = latestEpisode.links[CloudService.ZIPPYSHARE];	
// 			console.log(latestEpisode.number, latestEpisodeLink);
// 			downloadFileByUrlAndDriver(latestEpisodeLink, zippyDriver).then(function(result){
// 				console.log(result.b)
// 			});
//  }else{
//  	console.log('not available for zippy :(')
//  }
// });




// var url = 'http://mp3.li/download.php?d=EYTo0OntzOjE6ImgiO3M6MzI6ImUzNmZkMzc3NWNhYzRlMTQwMTZhMjgyNzBjOGQ1YmUyIjtzOjE6InQiO3M6NTA6IlRoZSBXYW50ZWQgLSBDaGFzaW5nIFRoZSBTdW4gKEhhcmR3ZWxsIFJhZGlvIEVkaXQpIjtzOjE6ImMiO2k6MTQxMzcxMDAzNjtzOjI6ImlwIjtzOjEyOiI4My4zMC43Ny4xMTMiO30=';
// var getFilePromise= mp3LiDriver.getFileByUrl(url);
// getFilePromise.then(function(file){
// console.log(file.name)
// //file.stream.pipe(fs.createWriteStream(file.name));
// });

var downloadFileByUrlAndDriver = function(url, driver){
	var deferred = q.defer();
	var progressDownloadCallback = function(progress){
		console.log('downloading',progress);
	}
	var getFilePromise= driver.getFileByUrl(url, progressDownloadCallback);
	getFilePromise.then(function(file){
		console.log(file.name);
		//file.stream.pipe(fs.createWriteStream(file.name));
		var uploadFilePromise = dbManager.saveFile(file);
		uploadFilePromise.then(function(response){
		  deferred.resolve(response);
		});//saveFile
	});//getFilePromise
	return deferred.promise;
};








// var app = express(); 

//    app.use(function(req, res, next){        
//         next();
//    });

// app.get('/test', function(req, res){
//  res.send({x: 1});
// });
//    app.listen(80);















  
