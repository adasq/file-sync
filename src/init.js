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

var promise = googleDriveManager.getByArtist('hardwell');
promise.then(function(episodes){
	console.log(episodes)
});
 return;


// var url = 'http://mp3.li/download.php?d=EYTo0OntzOjE6ImgiO3M6MzI6ImUzNmZkMzc3NWNhYzRlMTQwMTZhMjgyNzBjOGQ1YmUyIjtzOjE6InQiO3M6NTA6IlRoZSBXYW50ZWQgLSBDaGFzaW5nIFRoZSBTdW4gKEhhcmR3ZWxsIFJhZGlvIEVkaXQpIjtzOjE6ImMiO2k6MTQxMzcxMDAzNjtzOjI6ImlwIjtzOjEyOiI4My4zMC43Ny4xMTMiO30=';
// var getFilePromise= mp3LiDriver.getFileByUrl(url);
// getFilePromise.then(function(file){
// console.log(file.name)
// //file.stream.pipe(fs.createWriteStream(file.name));
// });



var progressDownloadCallback = function(progress){
	console.log('download',progress);
}
var getFilePromise= zippyDriver.getFileByUrl(url, progressDownloadCallback);
getFilePromise.then(function(file){
console.log(file.name);
//file.stream.pipe(fs.createWriteStream(file.name));
var uploadFilePromise = dbManager.saveFile(file);
uploadFilePromise.then(function(response){
  console.log(response.b)
});//saveFile
});//getFilePromise






// var app = express(); 

//    app.use(function(req, res, next){        
//         next();
//    });

// app.get('/test', function(req, res){
//  res.send({x: 1});
// });
//    app.listen(80);















  
