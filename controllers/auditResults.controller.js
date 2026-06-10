// initie variable pour model users pour pouvoir l'utiliser
const User = require('../models/users');

// Gère la création de l'audit et retourne la réponse filtrée selon le statut de connexion
async function auditResults(req, res, siteDoc, axeCoreResults, url, handleAuditCreation) {
  try {
    const token = req.body.token;
    console.log(req.body)

    const newAudit = await handleAuditCreation(siteDoc._id, axeCoreResults, url);

    // Vérifie si l'utilisateur est connecté via son token
    const user = token ? await User.findOne({ token }) : null;

    if (!user) {
      // Non connecté : score global uniquement
      return res.status(200).json({
        result: true,
        website: siteDoc,
        audit: {
          summary: newAudit.results.summary,
        }
      });
    }

    // Connecté : toutes les données
    return res.status(200).json({
      result: true,
      website: siteDoc,
      audit: { ...newAudit }
    });

  } catch (err) {
    return res.status(500).json({ result: false, error: err.message });
  }
}

module.exports = { auditResults };
