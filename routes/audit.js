var express = require("express");
var router = express.Router();

const auditController = require('../controllers/audit.controller.js');

// Route POST qui lance un audit et récupère la proprieté "url" dans le corps (body) de la requête
router.post("/", auditController);

module.exports = router;
