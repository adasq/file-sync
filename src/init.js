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
EpisodeManager = require('./episodeManager'),
Artist = require('./models/artist'),
db = require('./db/connect');

 var zippyDriver = new ZippyShareDriver();
 var dbManager = new DropboxManager(); 
 var googleDriveManager = new GoogleDriveManager();
 var episodeManager = new EpisodeManager();
 var artist = new Artist();





var RadioShowsService = function(){
	this.state = {
		current: RadioShowsService.IDLE
	};
	this.episodeManager = new EpisodeManager();
};
RadioShowsService.IDLE = 0;
RadioShowsService.WAITING = 1;
RadioShowsService.GENERATING_REPORT = 2;
RadioShowsService.DOWNLOADING = 3;

RadioShowsService.prototype.getEpisodeReportByArtist = function(artist){
		var deferred = q.defer();
		var response = {
			artist: artist,
			error: true
		};
		var latestEpisodePromise = this.episodeManager.getLatestEpisodeByArtist(artist);
		latestEpisodePromise.then(function(latestEpisode){			
			if(latestEpisode.number > artist.data.lastEpisode){				
				 if(latestEpisode.links[CloudService.ZIPPYSHARE]){
						var latestEpisodeZippyLink = latestEpisode.links[CloudService.ZIPPYSHARE];														
							deferred.resolve(_.extend(response, {error: false, latestEpisodeZippyLink: latestEpisodeZippyLink ,episode: latestEpisode}));							
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
RadioShowsService.prototype.getReport = function(){
	var that= this, deferred = q.defer();
	var artist = new Artist();
	artist.getAll().then(function(artists){
		var reportPromises = [];
		reportPromises= _.map(artists, function(artist){	
			return (that.getEpisodeReportByArtist(artist));
		});
		q.all(reportPromises).then(function(reports){
			deferred.resolve(reports);			
		});
	});//artistPromise
return deferred.promise;
};
RadioShowsService.prototype.generateReport = function(config){
		var that= this, deferred = q.defer();
		var report = {
			startDate: new Date(),
			endDate: null,
			generationTime: 0,
			episodesState: null,
		}
	this.getReport().then(function(episodesState){
		report.endDate = new Date();
		report.episodesState = episodesState;	
		report.generationTime = (+report.endDate) - (+report.startDate);
		deferred.resolve(report);
	});
return deferred.promise;
};
RadioShowsService.prototype.checkReport = function(report){
	var that = this,
	availableEpisodes = [];

	_.each(report.episodesState, function(episode){
		if(!episode.error){
			availableEpisodes.push(episode);
		}
	}); 
	console.log(availableEpisodes.length)
	if(availableEpisodes.length > 0){
		that.state.current= RadioShowsService.DOWNLOADING;
		
		var promises= _.map(availableEpisodes, function(episode){	
				return function(){
					return downloadFileByUrlAndDriver(episode.latestEpisodeZippyLink, zippyDriver);
				};
		});
		var result = q();
		promises.forEach(function (f) {
		    result = result.then(f);
		});
		result.then(function(response){
			that.state.current= RadioShowsService.WAITING;
		});

	}else{
		console.log(33333)
	};
	return true;

};
RadioShowsService.prototype.initRaportGeneratorWorker = function(config){
	var that = this;
	config = _.extend({
		timeout: 1000* 4
	}, (config || {}));
	
	var worker = function(){
				if(that.state.current === RadioShowsService.WAITING){
					console.log('GENERATING_REPORT')
					that.state.current= RadioShowsService.GENERATING_REPORT;
					that.generateReport().then(function(report){						
						that.state.current= RadioShowsService.WAITING;	

						console.log('WAITING')	
						that.checkReport(report);
					});							
				}else{
					console.log('...')
				}
	};
	worker();
	setInterval(worker, config.timeout);
};
RadioShowsService.prototype.init = function(config){
	this.state.current = RadioShowsService.WAITING;
	this.initRaportGeneratorWorker();


};
//======================================================================

var edm = new RadioShowsService();
var config = {};
edm.init(config)



var downloadFileByUrlAndDriver = function(url, driver){
	var deferred = q.defer();
	console.log("STARTING!")
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





return;
							_.each(reports, function(report){
								if(report.error){
									console.log(report.artist.data.name+": "+report.message)
								}else{
									console.log(report.artist.data.name+": "+JSON.stringify(report));
									// downloadFileByUrlAndDriver(latestEpisodeLink, zippyDriver).then(function(result){
												// 	console.log(result.b)
												// });
								}
							});

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















  
