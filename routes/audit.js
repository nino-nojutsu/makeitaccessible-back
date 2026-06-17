var express = require("express");
var router = express.Router();

const { createAuditController, getAuditController, getAllAuditsController, deleteAuditController } = require('../controllers/audit.controller.js');

// Route POST qui lance un audit et récupère la proprieté "url" dans le corps (body) de la requête
router.post("/", createAuditController);      

// Route POST pour enregistrer tous les audits
router.post("/all", getAllAuditsController);   

// GET (1 audit + tests)
router.get("/:id", getAuditController);  

// DELETE / supprimer un audit d'une page
router.delete("/:auditId", deleteAuditController);  


module.exports = router;
