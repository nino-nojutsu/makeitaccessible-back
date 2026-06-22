var express = require("express");
var router = express.Router();

const { getSiteAuditSummaryController, deleteSiteController, getSiteView } = require('../controllers/site.controller.js');

// POST / enregistre un résumé pour un site (tous les audits (url) d'un même site (domain))
router.post("/:siteId/audit-summary", getSiteAuditSummaryController); 

// GET /
router.get('/archive/:token/:id', getSiteView);

// DELETE / supprimer un site
router.delete('/:siteId', deleteSiteController);

module.exports = router;