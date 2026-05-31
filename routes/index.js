var express = require("express");
var router = express.Router();
//const fetch = require("node-fetch");
const runAllTests = require("../tests/runAllTests.js");

// 0. route POST qui lance un audit et récupère la key url dans le corps de la requête
router.post("/audit", async (req, res) => {
  const { url } = req.body;

  if (url === undefined || url === '') {
    res.status(403).json({result: false, error: 'Missing or empty url'})
    return;
  }

  // Lance le scan via runAllTests
  const results = await runAllTests(url);

  if (results) {
    res.status(200).json({result: true, results})
  }
});

module.exports = router;
