var express = require('express');
var router = express.Router();
const passport = require('passport');

// Redirection vers Google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Callback Google
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    // req.user vient de passport.js

    if (!req.user) {
      return res.status(401).json({ result: false, error: 'Auth failed' });
    }

    res.json({
      result: true,
      message: 'Login successful',
      token: req.user.token,
      user: {
        firstName: req.user.firstName,
        email: req.user.email,
      },
    });
  }
);

module.exports = router;