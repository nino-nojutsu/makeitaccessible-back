var express = require("express");
var router = express.Router();

const { getSiteAuditSummaryController } = require('../controllers/site.controller.js');

// POST / enregistre un résumé pour un site (tous les audits (url) d'un même site (domain))
router.post("/:siteId/audit-summary", getSiteAuditSummaryController); 

module.exports = router;