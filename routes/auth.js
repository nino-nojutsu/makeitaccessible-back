var express = require('express');
var router = express.Router();
const passport = require('passport');

// 🔵 1. Redirection vers Google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// 🔵 2. Callback Google
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    // req.user vient de passport.js

    if (!req.user) {
      return res.status(401).json({ result: false, error: 'Auth failed' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const redirectUrl = new URL('/auth/google/callback', frontendUrl);

    redirectUrl.searchParams.set('token', req.user.token);
    redirectUrl.searchParams.set('firstName', req.user.firstName || '');
    redirectUrl.searchParams.set('email', req.user.email || '');

    res.redirect(redirectUrl.toString());
  }
);

module.exports = router;
