const mongoose = require("mongoose");

const auditSchema = mongoose.Schema({
  url: { type: String, default: null }, // url du site à auditer
  status: { type: String, default: "pending" }, // status d'état de l'analyse renvoyé par axe-core
  errorMessage: { type: String, default: null }, // message d'erreur si l'audit à échouer renvoyé par axe-core
  createdAt: { type: Date, default: Date.now() }, // date de création de l'audit
  summary: {
    total: { type: Number, default: 0 }, // nombre total de critères évalués
    passed: { type: Number, default: 0 }, // nombre total de critères validés
    failed: { type: Number, default: 0 }, // nombre total de critères non valides
    inapplicable: { type: Number, default: 0 }, // nombre total de critères non applicables
    incomplete: { type: Number, default: 0 }, // nombre total de critères non testables
    score: { type: Number, default: 0 }, // pourcentage (passed / (passed + failed)) * 100
  },
  site: { type: mongoose.Schema.Types.ObjectId, ref: "sites" }, // réf. vers la collection sites
});

const Audit = mongoose.model("audits", auditSchema);

module.exports = Audit;
