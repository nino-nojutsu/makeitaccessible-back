var express = require("express");
var router = express.Router();
const runAllTests = require("../tests/runAllTests.js");

// Route POST qui lance un audit et récupère la key url dans le corps de la requête
router.post("/audit", (req, res) => {
  const { url } = req.body;

  // @nina todo : vérifier/tester qu'une url envoyée est bien au format url (http://, https://) via une regex
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
