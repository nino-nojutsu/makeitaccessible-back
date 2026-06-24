var express = require("express");
var router = express.Router();

const {testValidationAction, testIgnoreAction, testReviewAction} = require('../controllers/test.controller.js');

// Route PUT qui valide une rule axe-core
router.put("/validate", testValidationAction);

// Route PUT qui ignore une rule axe-core
router.put("/ignore", testIgnoreAction);

// Route PUT qui commente une rule axe-core
router.put("/review", testReviewAction);

module.exports = router;