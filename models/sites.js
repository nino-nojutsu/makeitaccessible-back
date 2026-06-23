const mongoose = require('mongoose');

const siteSchema = mongoose.Schema({
  name: String,
  domain: String,
  createdAt: Date,
  updatedAt: Date,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null },
});

const Site = mongoose.model('sites', siteSchema);

module.exports = Site;