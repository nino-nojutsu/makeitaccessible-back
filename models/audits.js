const mongoose = require('mongoose');

const auditSchema = mongoose.Schema({
  url: String,
  status: String,
  errorMessage: String,
  createdAt: Date,
  summary: {
    total:        Number,  // nombre total de critères évalués
    passed:       Number,  // nombre total de critères validés
    failed:       Number,  // nombre total de critères non valides
    inapplicable: Number,  // nombre total de critères non applicables
    incomplete:   Number,  // nombre total de critères non testables
    score:        Number,  // pourcentage (passed / (passed + failed)) * 100
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', default: null }, // réf. vers la collection users ou null si audit anonyme
  site: { type: mongoose.Schema.Types.ObjectId, ref: 'sites' }, // réf. vers la collection sites
});

const Audit = mongoose.model('audits', auditSchema);

module.exports = Audit;