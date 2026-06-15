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

router.get('/user', (req, res) => {
  const token = req.query.token
  if (!token) {
    res.json({ result: false, error: 'missing token' });
    return;
  }

User.findOne({ token: token })
 .then(data => {
  if (!data) {
    res.json({ result: false, error: 'User not found' });
    return;
  }

  data.password = undefined;
  res.json(data);
 })
 .catch(error => {
      res.json({ result: false, error: error.message });
    });
});

router.put('/user', (req, res) => {

  const token = req.body.token
    if (!token) {
    res.json({ result: false, error: 'missing token' });
    return;
  }

  const updates = {};
  if (req.body.firstName) updates.firstName = req.body.firstName.trim();
  if (req.body.lastName) updates.lastName = req.body.lastName.trim();
  if (req.body.username) updates.username = req.body.username.trim();
  if (req.body.email) updates.email = req.body.email.trim();
  if (req.body.password) updates.password = bcrypt.hashSync(req.body.password, 10);
  updates.updatedAt = Date.now();
  
  if(Object.keys(updates).length === 0) {
    res.json({ result: false, error: 'no fields to update' });
    return;
  }

  User.findOneAndUpdate(
    { token: token },
    updates,
 {new: true}
  )  
  .then(data => {

     if (!data) {
    return res.json({ result: false, error: "User not found" });
  }
    data.password = undefined;

    res.json({ result: true, user: data });
  })
  .catch(error => {
    res.json({ result: false, error: error.message });
  });

});

module.exports = router;
