var express = require('express');
var router = express.Router();

const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

/* GET users listing. */
router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['firstName', 'lastName','username', 'password', 'email'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ $or: [{ username: req.body.username }, { email: req.body.email }] }).then(data => {
    if (data) {
      res.json({ result: false, error: 'User already exists' });
      return;
    }
      const hash = bcrypt.hashSync(req.body.password, 10);
      
      const newUser = new User({
        firstName: req.body.firstName.trim() || '',
        lastName: req.body.lastName.trim() || '',
        username: req.body.username.trim() || '',
        email: req.body.email.trim() || '',
        password: hash,
        token: uid2(32),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      newUser.save().then(newDoc => {
        res.json({ result: true, token: newDoc.token });
      }).catch(err => {
        res.json({ result: false, error: err.message });
      });
  });
});

router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

    User.findOne({ username: req.body.username.trim() }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token });
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
    }
  });
});

module.exports = router;
