const User = require('../models/users');
const Test = require("../models/tests.js");
const { checkBody } = require("../modules/checkBody.js");

// Fonction qui valide un test
const testValidationAction = (req, res) => {
  if (!checkBody(req.body, ['token', 'testId'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Vérifie sur l'utilisateur est trouvé. Si l'utilisateur existe, il a l'autorisation de valider un test
  User.findOne({ token: req.body.token }).then(async user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    // Vérifie si le test a été trouvé
    const testDoc = await Test.findById(req.body.testId);
    // Récupère les keys ruleId et type depuis req.body et stocke dans des variables du même nom
    const { ruleId, type } = req.body;
    // Récupère la rule concernée pour mettre à jour le status de la rule
    const rule = testDoc[type].find(r => r.id === ruleId);
    console.log('rule', rule);
    // Mets à jour le status
    rule.status = 'validated';
    // Dis explicitement que l'array type (violations, incomplete, passes, inapplicable) à été modifié et doit persisté
    testDoc.markModified(type);
    // Mets à jour le document
    await testDoc.save().then((testDocUpdated) => {
      console.log('Test updated');
      res.status(200).json({ result: true, testDoc: testDocUpdated });
    });
  });
}

module.exports = {testValidationAction};