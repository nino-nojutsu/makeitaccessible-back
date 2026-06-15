var express = require("express");
var router = express.Router();

const {createAuditAction, getAuditAction} = require('../controllers/audit.controller.js');

// Route POST qui lance un audit et récupère la proprieté "url" dans le corps (body) de la requête
router.post("/", createAuditAction);

// Route GET qui récupère un audit par son id passé en params
router.get("/:id", getAuditAction);

module.exports = router;
