var express = require("express");
var router = express.Router();

const User = require("../models/users");
const Audit = require("../models/audits");
const Site = require("../models/sites");
const Test = require('../models/tests.js');
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

const updateAuditForUser = async (auditId, userDoc) => {
  return Audit.updateOne(
    { _id: auditId },
    { $set: { user: userDoc._id } }
  ).then(auditDoc => auditDoc.modifiedCount > 0);
}

/* POST route to register a new user */
router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["firstName", "lastName", "email", "username", "password"])) {
    res.json({ result: false, error: "Les champs requis sont manquants ou invalides" });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({
    $or: [{ username: req.body.username }, { email: req.body.email }],
  }).then((data) => {
    if (data !== null) {
      res.json({ result: false, error: "L'utilisateur existe déjà" });
      return;
    }
    const hash = bcrypt.hashSync(req.body.password, 10);

    const newUser = new User({
      firstName: req.body.firstName.trim(),
      lastName: req.body.lastName.trim(),
      username: req.body.username.trim(),
      email: req.body.email.trim(),
      password: hash,
      token: uid2(32),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    newUser.save().then(async (newDoc) => {
      // Si un audit a précédemment été créé en tant qu'utilisateur anonyme
      const { auditId } = req.body;

      // On relie l'utilisateur connecté à un audit
      if (auditId) {
        // Enregistrement d'un audit pour l'utilisateur connecté
        updateAuditForUser(auditId, newDoc);

        // On retourne les données utilisateurs et l'id de l'audit pour le front pour appeler /audit/:id et récupérer les tests de l'audit
        res.status(200).json({
          result: true,
          token: newDoc.token,
          auditId: auditId
        });
      } else {
        res.status(200).json({ result: true, token: newDoc.token });
      }
    })
      .catch((err) => {
        res.status(403).json({ result: false, error: err.message });
      });
  });
});

/* POST route to login a user */
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "Les champs requis sont manquants ou invalides" });
    return;
  }

  User.findOne({ username: { $regex: new RegExp(req.body.username, 'i') } }).then(async (userDoc) => {
    if (userDoc && bcrypt.compareSync(req.body.password, userDoc.password)) {

      // Si un audit a précédemment été créé en tant qu'utilisateur anonyme
      const { auditId } = req.body;

      // On relie l'utilisateur connecté à un audit
      if (auditId) {
        // Enregistrement d'un audit pour l'utilisateur connecté
        updateAuditForUser(auditId, userDoc);
        console.log('User is added to the audit');

        // On retourne les données utilisateurs et l'id de l'audit pour le front pour appeler /audit/:id et récupérer les tests de l'audit
        res.status(200).json({
          result: true,
          token: userDoc.token,
          username: userDoc.username,
          firstName: userDoc.firstName,
          auditId: auditId
        });
      } else {
        res.status(200).json({
          result: true,
          token: userDoc.token,
          username: userDoc.username,
          firstName: userDoc.firstName
        });
      }
    } else {
      res.status(403).json({ result: false, error: "Utilisateur non trouvé ou mot de passe incorrect" });
    }
  });
});

router.get("/:token", (req, res) => {
  const token = req.params.token;

  if (!token) {
    res.json({ result: false, error: "missing token" });
    return;
  }

  User.findOne({ token: req.params.token }).then(user => {
    if (user === null) {
      res.json({ result: false, error: 'User not found' });
      return;
    } else {
      user.password = undefined;
      res.json({ result: true, user });
    }
  });
});

router.put("/user", (req, res) => {
  const token = req.body.token;
  if (!token) {
    res.json({ result: false, error: "missing token" });
    return;
  }

  const updates = {};
  if (req.body.firstName) updates.firstName = req.body.firstName.trim();
  if (req.body.lastName) updates.lastName = req.body.lastName.trim();
  if (req.body.username) updates.username = req.body.username.trim();
  if (req.body.email) updates.email = req.body.email.trim();
  if (req.body.password)
    updates.password = bcrypt.hashSync(req.body.password, 10);

  if (Object.keys(updates).length === 0) {
    res.json({ result: false, error: "no fields to update" });
    return;
  }

  User.findOneAndUpdate({ token: token }, updates, { new: true })
    .then((data) => {
      if (!data) {
        return res.json({ result: false, error: "Utilisateur non trouvé" });
      }
      data.password = undefined;

      res.json({ result: true, user: data });
    })
    .catch((error) => {
      res.json({ result: false, error: error.message });
    });
});

// Delete route to delete a user
router.delete("/",  async(req, res)  => {
  if (!checkBody(req.body, ['token'])) {
    return res.json({ result: false, error: 'Les champs requis sont manquants ou invalides' });
  }

  const user = await User.findOne({ token: req.body.token });
  if (!user) {
    return res.json({ result: false, error: 'Utilisateur non trouvé' });
  }

  // 1. Tous les audits de l'utilisateur
  const audits = await Audit.find({ user: user._id }, '_id');
  const auditIds = audits.map(a => a._id);

  // 2. Tous les tests liés à ces audits
  await Test.deleteMany({ audit: { $in: auditIds } });

  // 3. Les audits
  await Audit.deleteMany({ user: user._id });

  // 4. L'utilisateur
  await User.deleteOne({ _id: user._id });

  User.deleteOne({ _id: user._id }).then(() => {
    res.json({ result: true, message: 'Deleted!' });
  });
});



module.exports = router;
