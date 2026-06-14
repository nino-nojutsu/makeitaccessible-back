var express = require("express");
var router = express.Router();

const User = require("../models/users");
const Audit = require("../models/audits");
const Site = require("../models/sites");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

const updateSiteForUser = async (websiteId, userDoc) => {
  return Site.updateOne(
    { _id: websiteId },
    { $set: { user: userDoc._id } }
  ).then(siteDoc => {
    if (siteDoc.modifiedCount > 0) {
      return true;
    } else {
      res.json({ result: false, error: `Site cannot be assigned to the user: ${userDoc._id}` });
    }
  });
}

const updateAuditForUser = async (auditId, userDoc) => {
  return Audit.updateOne(
    { _id: auditId },
    { $set: { user: userDoc._id } }
  ).then(auditDoc => {
    if (auditDoc.modifiedCount > 0) {
      return true;
    } else {
      res.json({ result: false, error: `Audit cannot be assigned to the user: ${userDoc._id}` });
    }
  });
}

/* GET users listing. */
router.post("/signup", (req, res) => {
  /* if (
    !checkBody(req.body, [
      "firstName",
      "lastName",
      "email",
      "username",
      "password",
    ])
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  } */

  // Check if the user has not already been registered
  User.findOne({
    $or: [{ username: req.body.username }, { email: req.body.email }],
  }).then((data) => {
    if (data !== null) {
      res.json({ result: false, error: "User already exists" });
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

    newUser.save().then((newDoc) => {
        res.json({ result: true, token: newDoc.token });
      })
      .catch((err) => {
        res.json({ result: false, error: err.message });
      });
  });
});

router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ username: { $regex: new RegExp(req.body.username, 'i') } }).then(async (userDoc) => {
    if (userDoc && bcrypt.compareSync(req.body.password, userDoc.password)) {

      // Si un audit a précédemment été créé en tant qu'utilisateur anonyme
      const { auditId, websiteId } = req.body;

      // On relie l'utilisateur connecté à une website et à un audit
      if (auditId !== null && websiteId !== null) {
        // Enregistrement d'un site pour l'utilisateur connecté
        const isUpdatedSite = await updateSiteForUser(websiteId, userDoc);
        console.log('User is added to the website');

        // Enregistrement d'un audit pour l'utilisateur connecté
        const isUpdatedAudit = await updateAuditForUser(auditId, userDoc);
        console.log('User is added to the audit');

        // On retourne les données utilisateurs les id du website et de l'audit pour le front
        if (isUpdatedSite && isUpdatedAudit) {
          res.json({
            result: true,
            token: userDoc.token,
            username: userDoc.username,
            firstName: userDoc.firstName,
            websiteId: websiteId,
            auditId: auditId
          });
        }
        
      } else {
        res.json({ result: true, token: userDoc.token, username: userDoc.username, firstName: userDoc.firstName });
      }
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  });
});

router.get("/user", (req, res) => {
  const token = req.query.token;
  if (!token) {
    res.json({ result: false, error: "missing token" });
    return;
  }

  User.findOne({ token: token })
    .then((data) => {
      data.password = undefined;
      res.json(data);
    })
    .catch((error) => {
      res.json({ result: false, error: error.message });
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
        return res.json({ result: false, error: "User not found" });
      }
      data.password = undefined;

      res.json({ result: true, user: data });
    })
    .catch((error) => {
      res.json({ result: false, error: error.message });
    });
});

module.exports = router;
