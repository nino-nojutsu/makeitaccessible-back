const mongoose = require('mongoose');

const siteSchema = mongoose.Schema({
  name: String,
  domain: String,
  urls: [String],
  createdAt: Date,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
});

const Site = mongoose.model('sites', siteSchema);

module.exports = Site;