const mongoose = require("mongoose");

const auditSchema = mongoose.Schema({
  url: { type: String, default: null }, // url du site à auditer
  status: { type: String, default: "pending" }, // status d'état de l'analyse renvoyé par axe-core
  createdAt: { type: Date, default: Date.now() }, // date de création de l'audit
  summary: {
    inapplicable: { type: Number, default: 0 }, // nombre total de critères inapplicables
    passes: { type: Number, default: 0 }, // nombre total de critères validés
    incomplete: { type: Number, default: 0 }, // nombre total de critères incomplet
    violations: { type: Number, default: 0 }, // nombre total de critères en anomalie
    total: { type: Number, default: 0 }, // nombre total de critères évalués
    score: { type: Number, default: 0 }, // pourcentage de réussite : (passes / (passes + incomplete + violations) * 100)
  },
  site: { type: mongoose.Schema.Types.ObjectId, ref: "sites", default: null }, // réf. vers la collection sites
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null } // réf. vers la collections users
});

const Audit = mongoose.model("audits", auditSchema);

module.exports = Audit;
