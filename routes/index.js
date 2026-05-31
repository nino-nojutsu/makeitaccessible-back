var express = require("express");
var router = express.Router();
const runAllTests = require("../tests/runAllTests.js");
const Site = require('../models/sites.js');

// 0. route POST qui lance un audit et récupère la key url dans le corps de la requête
router.post("/audit", async (req, res) => {
  console.log('req.body', req.body);
  const { url, name, domain } = req.body;

  // @nina todo : vérifier/tester qu'une url envoyée est bien au format url (http://, https://) via une regex
  if (url === undefined || url === '') {
    res.status(403).json({result: false, error: 'Missing or empty url'})
    return;
  }

  // Lance le scan via runAllTests et on "attend" le retour des résultats avant d'enregistrer un site
  const auditResults = await runAllTests(url);

  // Si on a des résultats (anomalies, etc...)
  if (auditResults) {
    // On enregistre un site dans la collection "sites" en bdd
    const website = new Site({
      name,
      domain,
      urls: [url],
      createdAt: Date.now(),
    });

    website.save().then((newDoc) => {
      res.status(200).json({result: true, website: newDoc, auditResults})
    });
  }
});

module.exports = router;
