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
DropboxManager = require('./dropboxManager');

var url = 'http://www56.zippyshare.com/v/67575502/file.html'

console.log(URLManager.getCloudServiceByURL(url));
 
 var zippyDriver = new ZippyShareDriver();
 var dbManager = new DropboxManager(); 
 var googleDriveManager = new GoogleDriveManager();



var getLatestEpisodeByArtist = function(artist){
	var deferred = q.defer();
	var promise = googleDriveManager.getByArtist(artist);
	promise.then(function(episodes){
		var latestEpisode = episodes[episodes.length-1];
		if(latestEpisode){
			deferred.resolve(latestEpisode);
		}else{
			deferred.reject();
		}
	});
	return deferred.promise;
};



var promise = getLatestEpisodeByArtist('doorn');
promise.then(function(latestEpisode){
if(latestEpisode.links[CloudService.ZIPPYSHARE]){
		var latestEpisodeLink = latestEpisode.links[CloudService.ZIPPYSHARE];	
			console.log(latestEpisode.number, latestEpisodeLink);
			downloadFileByUrlAndDriver(latestEpisodeLink, zippyDriver).then(function(result){
				console.log(result.b)
			});
 }else{
 	console.log('not available for zippy :(')
 }
});




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















  
