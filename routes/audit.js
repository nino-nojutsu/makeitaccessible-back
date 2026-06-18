var express = require("express");
var router = express.Router();

const { createAuditAction, getAuditAction, getAllAuditsAction, deleteAuditAction } = require('../controllers/audit.controller.js');

// Route POST qui lance un audit et récupère la proprieté "url" dans le corps (body) de la requête
router.post("/", createAuditAction);      

// Route POST pour enregistrer tous les audits
router.post("/all", getAllAuditsAction);   

// GET (1 audit + tests)
router.get("/:id", getAuditAction);

// DELETE / supprimer un audit d'une page
router.delete("/:auditId", deleteAuditAction);  


module.exports = router;
