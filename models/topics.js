const mongoose = require('mongoose');

const topicSchema = mongoose.Schema({
  name: String,
  number: Number,
});

const Topic = mongoose.model('topics', topicSchema);

module.exports = Topic;