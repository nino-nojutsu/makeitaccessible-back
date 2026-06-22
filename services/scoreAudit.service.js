/* Ce service calcule le score d'un audit */

// Calcul des totaux pour l'audit en cours avec reduce :
// reduce = une boucle qui se cumule
// On crée un nouvel objet summary qui a 4 propriétés (inapplicable, passes, incomplete, violations) initialisées à 0
// Pour acc = l'accumulateur (l'objet summary en cours de construction), pour chacune de ses propriétés, on additionne à chaque itération la longueur 
const calculateAuditSummary = (tests) => {
    // reduce parcourt le tableau tests et additionne la longueur des tableaux de chaque test pour obtenir les totaux globaux de l'audit
    
    const summary = tests.reduce(
        (acc, test) => {
            acc.inapplicable += test.inapplicable.length;
            acc.passes += test.passes.length;
            acc.incomplete += test.incomplete.length;
            acc.violations += test.violations.length;
            return acc;
        },
        { inapplicable: 0, passes: 0, incomplete: 0, violations: 0 }
    );

    // => à la fin, summary contient les totaux de tous les tests
    // Toutes les règles évaluées, tous types confondus
    summary.total = summary.inapplicable + summary.passes + summary.incomplete + summary.violations;

    // Score = pourcentage de règles validées parmi les règles testables => incomplete et inapplicable sont exclus du calcul
    // incomplete et inapplicable sont exclus du calcul
    summary.score = calculateScore(summary.passes, summary.violations);

    return summary;
};

// Formule commune du score RGAA : passes / (passes + violations) × 100
// Les critères "incomplete" (non conclusifs, nécessitant vérification humaine) et "inapplicable" (non concernés par la page) sont exclus du calcul
// Utilisée par calculateAuditSummary (score par page) et getSiteAuditSummary (score global du site)
const calculateScore = (passes, violations) => {
    const rgaaScore = passes + violations;
    return rgaaScore > 0 ? Math.floor((passes / rgaaScore) * 100) : null;
};

module.exports = { calculateAuditSummary, calculateScore };