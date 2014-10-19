var
express = require('express'),
request = require('request'),
q = require('q'),
_= require('underscore'),
util = require('util'),
  vm = require('vm'),
fs = require('fs'),
cheerio = require('cheerio'),
ZippyShareDriver = require('./drivers/zippyShareDriver'),
DropboxManager = require('./dropboxManager');


 
var zippyDriver = new ZippyShareDriver();
var dbManager = new DropboxManager();


var url = 'http://www59.zippyshare.com/v/3254582/file.html'
var getFilePromise= zippyDriver.getFileByUrl(url);
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















  
