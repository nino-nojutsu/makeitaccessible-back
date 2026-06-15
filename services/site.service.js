const Audit = require("../models/audits.js");
const Test = require("../models/tests.js");

// "pire statut gagne" : 0 = pire, 3 = meilleur
const STATUS_AUDIT = ['violations', 'incomplete', 'passes', 'inapplicable'];

// Récupère le score global d'un site (fusion de toutes ses pages/audits)
// + la liste des pages avec leur score individuel
const getSiteAuditSummary = async (siteId) => {

    // 1. Tous les audits complétés de ce site, du plus récent au plus ancien
    const allAudits = await Audit.find({ site: siteId, status: "completed" })
        .sort({ createdAt: -1 });

    // 2. Ne garde que le dernier audit par URL (une page peut avoir été auditée plusieurs fois)
    const latestAuditsByUrl = new Map();
    allAudits.forEach(audit => {
        if (!latestAuditsByUrl.has(audit.url)) {
            latestAuditsByUrl.set(audit.url, audit);
        }
    });
    const audits = Array.from(latestAuditsByUrl.values());
    const auditIds = audits.map(a => a._id);

    // 3. Tous les tests (par thématique) liés à ces audits
    const tests = await Test.find({ audit: { $in: auditIds } });

    // 3.5 Fusion : si une règle échoue sur au moins une page,
    // alors elle compte comme violation au niveau du site, même si elle passe ailleurs
    const mergedRules = new Map();

    tests.forEach(test => {
        STATUS_AUDIT.forEach(status => {
            test[status].forEach(rule => {
                const key = rule.id; // identifiant de la règle axe-core
                const existing = mergedRules.get(key);
                if (!existing || STATUS_AUDIT.indexOf(status) < STATUS_AUDIT.indexOf(existing.status)) {
                    mergedRules.set(key, { status });
                }
            });
        });
    });

    // 4. On compte les statuts fusionnés
    const summary = { violations: 0, incomplete: 0, passes: 0, inapplicable: 0 };
    mergedRules.forEach(({ status }) => summary[status]++);

    // 5. Score global du site (même formule que par page)
    const denom = summary.passes + summary.violations;
    summary.score = denom > 0 ? Math.floor((summary.passes / denom) * 100) : null;

    // 6. Détail par page
    const pages = audits.map(a => ({
        auditId: a._id,
        url: a.url,
        score: a.summary.score,
    }));


    return { summary, pages };

}


module.exports = { getSiteAuditSummary };