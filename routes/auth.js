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
    if (!req.user) {
      return res.status(401).json({ result: false, error: 'Auth failed' });
    }

    const frontendUrl = 'http://localhost:3001';

    res.redirect(
      `${frontendUrl}/google-auth?token=${req.user.token}&firstName=${encodeURIComponent(
        req.user.firstName || ''
      )}&username=${encodeURIComponent(req.user.username || '')}`
    );
  }
);

module.exports = router;