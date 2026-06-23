const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require('../models/users');
const uid2 = require('uid2');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/callback',
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        // Sécurité : si pas d'email → stop
        if (!email) {
          return done(new Error('No email provided by Google'), null);
        }

        // 1. Cherche user par googleId
        let user = await User.findOne({ googleId: profile.id });

        // 2. Si pas trouvé → chercher par email (fusion compte)
        if (!user) {
          user = await User.findOne({ email });

          if (user) {
            // 🔗 Fusion compte existant
            user.googleId = profile.id;
            await user.save();
          } else {
            // 🆕 Création nouvel utilisateur
            const newUser = new User({
              firstName: profile.name?.givenName || '',
              lastName: profile.name?.familyName || '',
              username: email.split('@')[0] + uid2(4),
              email: email,
              googleId: profile.id,
              token: uid2(32),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });

            user = await newUser.save();
          }
        }

        return done(null, user);

      } catch (error) {
        return done(error, null);
      }
    }
  )
);