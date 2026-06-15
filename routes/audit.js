var express = require('express');
var router = express.Router();
const Audit = require('../models/audits');

router.get('/audits', (req, res) => {
  const search = req.query.search;

  if (!search) {
    return res.json({ result: false, error: 'missing search' });
  }

  const filter = { url: search };

  Audit.find(filter)
    .then(data => {
      res.json({ result: true, data });
    })
    .catch(error => {
      res.json({ result: false, error: error.message });
    });
});

router.get('/date', (req, res) => {
    const createdAt = req.query.createdAt;

    if (!createdAt) {
        return res.json({ result: false, error: 'missing date' });
    }
  
    const filter = { createdAt: createdAt };

    Audit.find(filter)
    .then(data => {
      res.json({ result: true, data });
    })
    .catch(error => {
      res.json({ result: false, error: error.message });
    });

})
module.exports = router;