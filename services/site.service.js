const Audit = require("../models/audits.js");
const Test = require("../models/tests.js");
const { calculateScore } = require("./score.service.js");

// "pire statut gagne" : 0 = pire, 3 = meilleur
const STATUS_AUDIT = ['violations', 'incomplete', 'passes', 'inapplicable'];

// Récupère le score global d'un site (fusion de toutes ses pages/audits)
// + la liste des pages avec leur score individuel
const getSiteAuditSummary = async (siteId) => {

    // 1. Tous les audits complétés (= toutes les pages) de ce site (d'un domaine)
    const audits = await Audit.find({ site: siteId });
    const auditIds = audits.map(a => a._id);

    // 2. Tous les tests (par thématique) liés à ces audits
    const tests = await Test.find({ audit: { $in: auditIds } });

    /* 3. Fusion : si une règle échoue sur au moins une page,
    alors elle compte comme violation au niveau du site, même si elle passe ailleurs*/
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
    summary.score = calculateScore(summary.passes, summary.violations);

    // 6. Détail par page
    const pages = audits.map(a => ({
        auditId: a._id,
        url: a.url,
        score: a.summary.score,
    }));

    return { summary, pages };

}


module.exports = { getSiteAuditSummary };