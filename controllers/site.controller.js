const User = require("../models/users.js");
const Site = require("../models/sites.js");
const Audit = require("../models/audits.js");
const { getSiteAuditSummary } = require("../services/site.service.js");

// Score global d'un site (fusion de toutes ses pages) si user connecté uniquement
const getSiteAuditSummaryController = async (req, res) => {
  const { token } = req.body;
  const { siteId } = req.params;

  if (!token) {
    return res.status(403).json({ result: false, error: "Token manquant" });
  }

  const user = await User.findOne({ token });
  if (!user) {
    return res.status(403).json({ result: false, error: "Utilisateur non trouvé" });
  }

  const site = await Site.findById(siteId);
  if (!site) {
    return res.status(403).json({ result: false, error: "Site introuvable" });
  }

  const hasAccess = await Audit.exists({ site: siteId, user: user._id });
  if (!hasAccess) {
    return res.status(403).json({ result: false, error: "Accès non autorisé à ce site" });
  }

  const { summary, pages } = await getSiteAuditSummary(siteId);

  res.status(200).json({
    result: true,
    site: { _id: site._id, name: site.name, domain: site.domain },
    summary,
    pages,
});
};

module.exports = { getSiteAuditSummaryController };