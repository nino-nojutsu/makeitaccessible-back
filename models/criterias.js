const mongoose = require('mongoose');

const testSchema = mongoose.Schema({
  testNumber: Number,
  conditions: [String],
});

const criteriaSchema = mongoose.Schema({
  criteriaNumber: Number,
  title: String,
  criticality: String,
  reference: [String],
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'topics' },
  tests: [testSchema],
});

const Criteria = mongoose.model('criterias', criteriaSchema);

module.exports = Criteria;