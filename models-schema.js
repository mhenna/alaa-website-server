const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
  name:  {type: String, required: true, unique: true},
  model: String,
  project: String
});

const Model = mongoose.model('Model', modelSchema);
module.exports = Model;