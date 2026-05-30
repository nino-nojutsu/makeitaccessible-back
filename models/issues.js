const mongoose = require('mongoose');

const issueSchema = mongoose.Schema({
  category: String,
  passed: Array,
  failed: Array,
  inapplicable: Array,
  incomplete: Array,
  status: String,   // "to_do" | “validated" | "removed"
  comments: String, // 'Voir avec le dev s’il est possible de corriger cette anomalie rapidement et estimer les délais de résolutions'
  audit: { type: mongoose.Schema.Types.ObjectId, ref: 'audits' }, // ref. vers la collection audits
});

const Issue = mongoose.model('issues', issueSchema);

module.exports = Issue;