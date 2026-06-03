const mongoose = require('mongoose');

const testSchema = mongoose.Schema({
  category: String,
  inapplicable: Array,
  passes: Array,
  incomplete: Array,
  violations: Array,
  status: {type: String, default: 'to_do'},   // "to_do" | “validated" | "removed"
  comments: { type: String, default: ''}, // 'Voir avec le dev s’il est possible de corriger cette anomalie rapidement et estimer les délais de résolutions'
  audit: { type: mongoose.Schema.Types.ObjectId, ref: 'tests' }, // ref. vers la collection audits
});

const Test = mongoose.model('tests', testSchema);

module.exports = Test;