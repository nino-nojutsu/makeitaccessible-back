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
  User.findOne({ token: req.body.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    // Vérifie si le test a été trouvé
    Test.findById(req.body.testId).then(testDoc => {
      if (!testDoc) {
        res.json({ result: false, error: 'Test not found' });
        return;
      }

      console.log('testDoc._id', testDoc._id);

      Test.updateOne(
        { _id: testDoc._id },
        {
          $set: {
            status: "validated"
          }
        }
      ).then((updatedTest) => {
        if (updatedTest.modifiedCount > 0) {
          console.log('Test updated');
          res.status(200).json({ result: true });
        } else {
          res.status(403).json({ result: false, error: 'Unable to update a test' });
        }
      });
    });
  });
}

module.exports = {testValidationAction};