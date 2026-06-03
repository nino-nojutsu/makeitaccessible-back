const mongoose = require('mongoose');

const topicSchema = mongoose.Schema({
  name: String,
  topicNumber: Number,
});

const Topic = mongoose.model('topics', topicSchema);

module.exports = Topic;