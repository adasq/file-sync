
var mongoose = require('mongoose'),
Schema = mongoose.Schema;

//------------------------------------------
var Artists = new Schema({
   name     : {type: String, unique: true, required: true}, 
   spreadsheetId : {type: String, unique: true, required: true}, 
   lastEpisode     : {type: Number, required: true},
});

mongoose.model('Artists', Artists);
exports.Artists = function(db) {
  return db.model('Artists');
};