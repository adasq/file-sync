var MongoModel = require('./MongoModel');

var Artist = function(data){
  this.data = data || {};
  this._constructor = Artist;
  this._mongoCollection = 'Artists';
};
Artist.prototype = MongoModel.prototype;

module.exports = Artist;