var express = require("express");
var router = express.Router();

const {testValidationAction} = require('../controllers/test.controller.js');

// Route PUT qui valide un test
router.put("/validate", testValidationAction);

module.exports = router;