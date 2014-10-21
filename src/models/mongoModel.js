
var db = require('../db/connect'),
q = require('q'),
_= require('underscore');

//=====================================================================================
var MongoModel = function(){};
MongoModel.prototype._db = db; 
//--------------------------
MongoModel.prototype.getAll = function(){
	var that=this, deferred = q.defer();

  this._db[this._mongoCollection].find().exec(function(err, artists){
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

module.exports = MongoModel;