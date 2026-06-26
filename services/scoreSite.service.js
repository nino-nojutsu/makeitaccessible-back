/* Ce service calcule le score global d'un site en fusionnant tous ses audits */

const Audit = require("../models/audits.js");
const Test = require("../models/tests.js");
const { calculateScore } = require("./scoreAudit.service.js");

/* 
  NOTE_AUDIT définit l'ordre de gravité des statuts, du pire au meilleur :
  => index 0 = violations(anomalie confirmée)
  => index 1 = incomplete (nécessite une vérification humaine)
  => index 2 = passes (règle validée)
  => index 3 = inapplicable (ne concerne pas cette page)
  
  Cet ordre est utilisé pour comparer les statuts entre les pages :
  un index plus petit = un statut plus grave
*/

const NOTE_AUDIT = ['violations', 'incomplete', 'passes', 'inapplicable'];

const getSiteAuditSummary = async (siteId, userId) => {

    // ÉTAPE 1 : Récupère tous les audits du site Audit.find({ site: siteId })
    const audits = await Audit.find({ site: siteId, status: "completed", user: userId });

    // OPTION 1 => seul audit : on retourne directement son score stocké
    // Précision : audits est un tableau retourné par Audit.find()
    // même s'il ne contient qu'un seul élément, c'est toujours un tableau d'où le [0]

    if (audits.length === 1) {
        return {
            summary: audits[0].summary,
            pages: [{
                auditId: audits[0]._id,
                url: audits[0].url,
                score: audits[0].summary.score,
            }]
        };
    }

    // OPTION 2 => un site a plusieurs audits 
    // On récupère uniquement les _id de chaque audit
    // map() va créer un nouveau tableau en transformant chaque élément
    // $in = "dont l'audit est dans cette liste d'ids"
    // On récupère tous les tests qui appartiennent à ces audits en 1 requête 
    const auditIds = audits.map(a => a._id);
    const tests = await Test.find({ audit: { $in: auditIds } });

    // On va fusionner toutes les règles de tous les tests de toutes les pages
    // On utilise un objet vide pour stocker la règle et son pire statut trouvé
    const mergedRules = {};

    // On parcourt chaque test (= chaque thématique RGAA de chaque page)
    tests.forEach(test => {

        // Pour chaque statut possible : violations, incomplete, passes, inapplicable
        // NOTE_AUDIT est trié du pire au meilleur : violations = index 0 (pire)
        NOTE_AUDIT.forEach(notes => {

            // Pour chaque règle dans ce statut (ex: chaque règle en violation)
            test[notes].forEach(rule => {

                // L'identifiant unique de la règle
                const key = rule.id;

                // On cherche si cette règle a déjà été rencontrée sur une autre page
                const existing = mergedRules[key];

                // Si la règle n'existe pas encore OU si le statut actuel est pire que celui déjà enregistré
                // indexOf() retourne la position dans le tableau : 0 = violations (pire), 3 = inapplicable (meilleur)
                // Un index plus petit = un statut plus grave
                if (!existing || NOTE_AUDIT.indexOf(notes) < NOTE_AUDIT.indexOf(existing.notes)) {
                    // On enregistre (ou écrase) avec le pire statut trouvé
                    mergedRules[key] = { notes };
                }
            });
        });
    });

    // On compte combien de règles sont dans chaque statut final
    const summary = { violations: 0, incomplete: 0, passes: 0, inapplicable: 0 };

    // Object.values() retourne un tableau de toutes les valeurs de l'objet
    Object.values(mergedRules).forEach(({ notes }) => summary[notes]++);

    // On calcule le score global du site avec la même formule que par page
    summary.score = calculateScore(summary.passes, summary.violations);

    // On construit la liste des pages avec leur score individuel
    // pour pouvoir les afficher séparément dans le dashboard
    const pages = audits.map(a => ({
        auditId: a._id,
        url: a.url,
        score: a.summary.score,
    }));

    return { summary, pages };
};

module.exports = { getSiteAuditSummary };