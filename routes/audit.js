var express = require("express");
var router = express.Router();

const {
  createAuditAction,
  getAuditAction,
  getAllAuditsAction,
  getAuditViewAction,
  deleteAuditAction,
  searchAuditAction,
  generatePDFAuditAction } = require('../controllers/audit.controller.js');

// Route POST qui lance un audit et récupère la proprieté "url" dans le corps (body) de la requête
router.post("/", createAuditAction);

// Route POST pour enregistrer tous les audits
router.post("/all", getAllAuditsAction);

// Route GET : récupère les résultats d'audit et ses tests associés
router.get("/:id", getAuditAction);

// Route GET : audit dynamique
router.get('/archive/:token/:id', getAuditViewAction);

// Route GET : rechercher un audit
router.get('/search/:token', searchAuditAction);

// Route DELETE : supprimer un audit d'une page
router.delete("/:id", deleteAuditAction);

// Route GET : genérer les résultats d'un audit au format PDF
router.get("/:token/:id/generate-pdf", generatePDFAuditAction);


module.exports = router;
