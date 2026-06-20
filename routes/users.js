var express = require("express");
var router = express.Router();

const User = require("../models/users");
const Audit = require("../models/audits");
const Site = require("../models/sites");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

const updateAuditForUser = async (auditId, userDoc) => {
  return Audit.updateOne(
    { _id: auditId },
    { $set: { user: userDoc._id } }
  ).then((auditDoc) => auditDoc.modifiedCount > 0);
};

/* POST route to register a new user */
router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["firstName", "lastName", "email", "username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

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

    newUser
      .save()
      .then(async (newDoc) => {
        const { auditId } = req.body;

        if (auditId) {
          updateAuditForUser(auditId, newDoc);

          res.status(200).json({
            result: true,
            token: newDoc.token,
            auditId: auditId,
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
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({
    username: { $regex: new RegExp(req.body.username, "i") },
  }).then(async (userDoc) => {
    if (userDoc && bcrypt.compareSync(req.body.password, userDoc.password)) {
      const { auditId } = req.body;

      if (auditId) {
        updateAuditForUser(auditId, userDoc);
        console.log("User is added to the audit");

        res.status(200).json({
          result: true,
          token: userDoc.token,
          username: userDoc.username,
          firstName: userDoc.firstName,
          auditId: auditId,
        });
      } else {
        res.status(200).json({
          result: true,
          token: userDoc.token,
          username: userDoc.username,
          firstName: userDoc.firstName,
        });
      }
    } else {
      res.status(403).json({
        result: false,
        error: "User not found or wrong password",
      });
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
      if (!data) {
        return res.json({ result: false, error: "User not found" });
      }

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

  if (req.body.password) {
    updates.password = bcrypt.hashSync(req.body.password, 10);
  }

  if (Object.keys(updates).length === 0) {
    res.json({ result: false, error: "no fields to update" });
    return;
  }

  updates.updatedAt = Date.now();

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